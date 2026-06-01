# Module 2 — etcd & the Storage Layer

> **Series:** Kubernetes Internals Mastery  
> **Prerequisites:** Module 1 — API Request Lifecycle  
> **Source anchors:** kubernetes/kubernetes `staging/src/k8s.io/apiserver`, `vendor/go.etcd.io/etcd`

---

## 1. What etcd actually is

etcd is a distributed key-value store built on the **Raft consensus algorithm**. Kubernetes uses it as its sole persistent store — every object you create (Pod, Deployment, Secret, ConfigMap, CRD instance) lives as a binary-encoded protobuf blob in etcd. Nothing else is persisted by the control plane.

**One sentence that matters:** the API server is stateless — etcd is the state.

Key properties Kubernetes relies on:
- **Linearizability** — every read sees the latest committed write, even across nodes.
- **Watch API** — clients subscribe to key-range changes and receive events in order.
- **MVCC** — Multi-Version Concurrency Control; every write creates a new revision, old revisions are kept until compaction.

---

## 2. The etcd data model inside Kubernetes

### Key structure

The API server stores objects under a deterministic key:

```
/registry/<group>/<resource>/<namespace>/<name>
```

Examples:
```
/registry/pods/default/nginx-6d4f8c9b-x2z9p
/registry/deployments/kube-system/coredns
/registry/secrets/production/db-credentials
/registry/apiextensions.k8s.io/customresourcedefinitions/widgets.example.com
```

Cluster-scoped resources omit the namespace segment:
```
/registry/nodes/ip-10-0-1-42.ec2.internal
/registry/namespaces/production
```

**Source:** [`staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go) — `KeyFunc` constructs the etcd path from object metadata.

### Value encoding

Values are **protobuf-encoded**, not JSON. The API server writes a `Unknown` wrapper envelope that contains:

1. A 4-byte magic prefix `k8s\x00` identifying Kubernetes-encoded data.
2. The protobuf-serialised `runtime.Unknown` object with `TypeMeta` (apiVersion, kind).
3. The actual object serialised in the registered protobuf schema.

**Why not JSON?** Protobuf is ~3–10× smaller and faster to deserialise. JSON responses from `kubectl` are converted server-side by the API server from the stored protobuf.

**Source:** [`staging/src/k8s.io/apiserver/pkg/storage/etcd3/store.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/storage/etcd3/store.go) — `transformer.TransformToStorage` encodes the object before writing.

### Resource versions

Every etcd key-value pair carries a **revision** — a monotonically increasing cluster-wide integer that increments on every write to any key. The API server surfaces this as `resourceVersion` on every Kubernetes object.

```yaml
metadata:
  resourceVersion: "482931"
```

This is not a per-object version counter — it is the **global etcd revision** at the time that object was last written. Clients use it for:
- **Optimistic concurrency control:** PUT requests include the current `resourceVersion`; etcd rejects the write if the revision has changed since the client read.
- **Watch start points:** `watch?resourceVersion=482931` replays events starting from that revision.

---

## 3. The Watch/Notify pipeline

### How a watch flows from etcd to your controller

```
etcd gRPC watch stream
    │
    ▼
API server watchCache (pkg/storage/cacher/cacher.go)
    │  in-memory ring buffer of recent events
    │  serves most watches without hitting etcd
    ▼
watchServer (pkg/apiserver/watch.go)
    │  filters by namespace, label selector, field selector
    ▼
client-go ListWatch → Informer → WorkQueue → Reconciler
```

**Source:** [`staging/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go) — `Cacher` wraps the etcd storage layer and maintains the in-memory event cache.

### watchCache internals

The `watchCache` maintains a **sliding window** (default 100–1000 events depending on resource type) of recent events in a circular buffer. When a new watcher connects with `resourceVersion=X`:

1. If X is within the buffer window — the API server serves events from memory without touching etcd.
2. If X is too old (before the buffer start) — the watcher gets a `410 Gone` (Expired) response and must relist.
3. If X is 0 or unset — the API server returns a full list snapshot + starts streaming new events.

The `410 Gone` behaviour is why every production controller must handle re-list gracefully.

### Event types

etcd emits three event types that map to Kubernetes watch events:

| etcd event | Kubernetes watch event |
|---|---|
| PUT (new key) | ADDED |
| PUT (existing key, new revision) | MODIFIED |
| DELETE | DELETED |

There is also a synthetic `BOOKMARK` event — an empty heartbeat carrying the latest revision — so clients can advance their `resourceVersion` even during quiet periods.

---

## 4. MVCC and compaction

### How MVCC works in etcd

Every write to etcd creates a **new revision** of a key. Old revisions are retained, allowing point-in-time reads:

```bash
# Read the current value of a key
etcdctl get /registry/pods/default/nginx

# Read the value at revision 48000
etcdctl get /registry/pods/default/nginx --rev=48000
```

Without compaction, etcd would grow without bound — every pod restart, every rolling update creates new revisions.

### Compaction

Compaction discards all revisions below a given point. The API server triggers compaction automatically via `pkg/storage/etcd3/compact.go`.

Default compaction interval: **5 minutes** (`--etcd-compaction-interval` flag on kube-apiserver).

```bash
# Manual compaction to revision 48000
etcdctl compact 48000

# After compaction, reads before rev 48000 return:
# Error: etcdserver: mvcc: required revision has been compacted
```

**Why this matters for watches:** if a controller's `resourceVersion` is before the compaction point, its watch stream dies with `410 Gone` and it must relist — triggering a full cache reload.

**Source:** [`staging/src/k8s.io/apiserver/pkg/storage/etcd3/compact.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/storage/etcd3/compact.go)

---

## 5. Snapshot and restore

### How etcd snapshots work

etcd automatically snapshots the BoltDB B-tree to disk when the Raft log exceeds `--snapshot-count` entries (default: 100,000). The snapshot contains the full key-value state at a specific revision; older Raft log entries are then safe to discard.

**Manual snapshot:**
```bash
etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d).db

# Verify
etcdctl snapshot status /backup/etcd-snapshot-$(date +%Y%m%d).db \
  --write-out=table
```

Output:
```
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| a3f1b2c4 |  1048576 |       4231 |     6.2 MB |
+----------+----------+------------+------------+
```

### Restore procedure

```bash
# Stop the kube-apiserver and etcd on all control-plane nodes first.
etcdctl snapshot restore /backup/etcd-snapshot-20260101.db \
  --name etcd-1 \
  --initial-cluster etcd-1=https://10.0.1.10:2380 \
  --initial-cluster-token etcd-cluster-1 \
  --initial-advertise-peer-urls https://10.0.1.10:2380 \
  --data-dir /var/lib/etcd-restored

# Replace /var/lib/etcd with /var/lib/etcd-restored and restart etcd.
```

**Critical:** each node in a multi-node etcd cluster must be restored independently from the **same snapshot**. Restoring from different snapshots creates a split-brain.

---

## 6. What happens when etcd loses quorum

etcd requires a majority quorum `(n/2)+1` to accept writes. A 3-node cluster tolerates 1 failure; a 5-node cluster tolerates 2.

### Quorum loss scenario (3-node cluster, 2 nodes down)

1. Writes to the API server return `503 Service Unavailable` or `etcdserver: request timed out`.
2. **Reads may still succeed** — etcd can serve stale reads if the remaining node's cache is warm. Kubernetes defaults to `quorum=true` reads which fail, but some clients use stale reads.
3. No new Pods can be scheduled. The scheduler and controllers cannot write new state.
4. Running Pods **continue running** — kubelet is decoupled from etcd; it only talks to the API server's watch stream, which also fails.
5. Service discovery degrades — kube-proxy can no longer receive Endpoint updates.

### Recovery from quorum loss

If all nodes are dead and you have no snapshot:
```bash
# Force-new-cluster — dangerous, only on single surviving member
etcd --force-new-cluster --data-dir=/var/lib/etcd
```

This discards the cluster membership record and promotes the single node as a new cluster. **Use only as a last resort** — it permanently removes the other members from the cluster config.

If you have a snapshot — prefer restore over `--force-new-cluster`.

---

## 7. EKS-managed etcd implications

In EKS, the control plane (including etcd) is **fully managed by AWS** and runs on AWS-owned infrastructure, outside your VPC.

| Concern | Self-managed | EKS |
|---|---|---|
| etcd backup | You run `etcdctl snapshot save` on a schedule | AWS backs up automatically, not customer-accessible |
| etcd access | Direct access via `etcdctl` | No direct access — AWS does not expose the etcd endpoint |
| etcd sizing | You choose instance type and disk | AWS manages; scales automatically |
| Quorum failures | You recover | AWS recovers; covered by the EKS SLA |
| Data-plane impact during etcd outage | Pods keep running, control plane unavailable | Same — data-plane is independent of the control-plane availability |
| `etcdctl` for debugging | Available | Not available — use API server audit logs instead |

### What this means for you as an EKS operator

- You **cannot** use `etcdctl` to inspect raw keys, compact manually, or restore from snapshot.
- Debugging "why did my object disappear?" requires **API server audit logs** (enabled via `--audit-log-path` on the API server, surfaced via CloudWatch Logs in EKS).
- etcd performance issues on EKS surface as **API server latency** (`apiserver_request_duration_seconds` metric). If p99 latency spikes, check your object count, watch fanout, and Secret/ConfigMap churn rate.
- The practical `etcd_db_total_size_in_bytes` metric is not directly accessible in EKS — track `apiserver_storage_objects` (count per resource type) as a proxy for etcd pressure.

---

## 8. Common failure modes and how to diagnose them

| Symptom | Root cause | Diagnosis |
|---|---|---|
| `etcdserver: mvcc: database space exceeded` | etcd data dir > quota (default 2 GB) | `etcdctl endpoint status` → `DB SIZE`; compact + defrag |
| Controllers relist constantly | Watch `resourceVersion` expired (compaction) | Check `watch_cache_capacity_*` and compaction interval |
| API server slow on `list` | Too many objects of one type | `etcdctl get --prefix /registry/<resource> --keys-only \| wc -l` |
| `context deadline exceeded` on writes | etcd leader election in progress or disk I/O saturation | Check etcd Raft metrics: `etcd_server_leader_changes_seen_total` |
| `resourceVersion too old` error on watch | Client reconnected with stale RV after compaction | Controller must call `List` first before resuming watch |

---

## Key takeaways

1. etcd is the **only** persistent component of the Kubernetes control plane. The API server, scheduler, and controllers are all stateless.
2. Protobuf + MVCC gives etcd its performance characteristics. ResourceVersion is a global revision, not a per-object counter.
3. The watchCache in the API server shields etcd from watch fan-out — most controllers never touch etcd directly.
4. Compaction is essential for etcd health but is the #1 cause of `410 Gone` on watches.
5. On EKS, you don't have direct etcd access — learn to read API server metrics and audit logs instead.

---

## Further reading

- [etcd documentation — data model](https://etcd.io/docs/v3.5/learning/data_model/)
- [etcd documentation — API guarantees](https://etcd.io/docs/v3.5/learning/api_guarantees/)
- [Kubernetes SIG etcd](https://github.com/kubernetes/community/tree/master/sig-etcd)
- [`pkg/storage/etcd3/store.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/storage/etcd3/store.go) — the primary read/write path
- [`pkg/storage/cacher/cacher.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go) — the watchCache implementation
