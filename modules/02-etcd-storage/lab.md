# Lab 2 — etcd & the Storage Layer

> **Runtime:** kind cluster (single control-plane node)  
> **Setup:** `bash lab.sh` (idempotent, ~2 min)  
> **Duration:** ~45 minutes

---

## Setup

```bash
bash lab.sh
```

The script creates a kind cluster named `etcd-lab` and exports `ETCDCTL_API`, `ETCDCTL_ENDPOINTS`, `ETCDCTL_CACERT`, `ETCDCTL_CERT`, and `ETCDCTL_KEY` into your shell environment. Source the env file it generates:

```bash
source /tmp/etcd-lab-env.sh
```

Verify etcd access:
```bash
etcdctl endpoint status --write-out=table
```

---

## Exercise 1 — Inspect raw key storage

**Goal:** see exactly how Kubernetes stores objects in etcd.

### 1a. List all keys for a resource type

```bash
etcdctl get /registry/pods --prefix --keys-only
```

Pick one pod key and retrieve its raw value:

```bash
etcdctl get /registry/pods/kube-system/<pod-name> | head -c 200
```

You'll see binary data. The first 4 bytes are the `k8s\x00` magic prefix.

### 1b. Decode the protobuf value

The API server registers a helper. Use `kubectl` to see the decoded form:

```bash
kubectl get pod -n kube-system <pod-name> -o json | jq .metadata.resourceVersion
```

Note the `resourceVersion`. Now read the same pod from etcd and confirm the revision matches:

```bash
etcdctl get /registry/pods/kube-system/<pod-name> --write-out=json | jq .kvs[0].mod_revision
```

**Expected:** the etcd `mod_revision` equals the `resourceVersion` in the Kubernetes API. They are the same global revision counter.

### 1c. Count objects by type

```bash
for resource in pods services deployments configmaps secrets; do
  count=$(etcdctl get /registry/$resource --prefix --keys-only | wc -l)
  echo "$resource: $count"
done
```

---

## Exercise 2 — Watch the etcd stream

**Goal:** observe the raw event stream before the API server's watchCache processes it.

### 2a. Start a raw watch on pods

In **Terminal 1**, start watching all pod keys:

```bash
etcdctl watch /registry/pods --prefix
```

In **Terminal 2**, create a pod:

```bash
kubectl run watch-test --image=nginx:alpine --restart=Never
```

Observe the raw etcd event in Terminal 1. You should see:
- Event type: `PUT`
- The key: `/registry/pods/default/watch-test`
- Binary value (the protobuf-encoded pod spec)

Delete the pod:

```bash
kubectl delete pod watch-test
```

You should see a `DELETE` event in Terminal 1.

### 2b. Track resource versions

```bash
# Get the current cluster-wide revision
etcdctl endpoint status --write-out=json | jq '.[0].Status.header.revision'
```

Create a pod, note the revision before and after:
```bash
REV_BEFORE=$(etcdctl endpoint status --write-out=json | jq '.[0].Status.header.revision')
kubectl run rev-test --image=nginx:alpine --restart=Never
REV_AFTER=$(etcdctl endpoint status --write-out=json | jq '.[0].Status.header.revision')
echo "Revision advanced by: $((REV_AFTER - REV_BEFORE))"
```

**Question:** why does the revision advance by more than 1 for a single `kubectl run`?  
**Answer:** the API server writes multiple keys — the Pod object itself, potentially a status update, and admission webhook bookkeeping — each incrementing the global revision.

---

## Exercise 3 — MVCC and revision history

**Goal:** read object state at past revisions.

### 3a. Create an object and modify it

```bash
kubectl create configmap mvcc-test --from-literal=version=1
```

Get its current revision:
```bash
REV1=$(kubectl get configmap mvcc-test -o jsonpath='{.metadata.resourceVersion}')
echo "Initial revision: $REV1"
```

Update the configmap:
```bash
kubectl patch configmap mvcc-test -p '{"data":{"version":"2"}}'
REV2=$(kubectl get configmap mvcc-test -o jsonpath='{.metadata.resourceVersion}')
echo "After update: $REV2"
```

### 3b. Read the old revision from etcd

```bash
# Read the configmap at the initial revision
etcdctl get /registry/configmaps/default/mvcc-test --rev=$REV1 | strings | grep version
```

You should see `version=1` from the old revision, even though the current value is `version=2`.

### 3c. Check database size before compaction

```bash
etcdctl endpoint status --write-out=table
```

Note the `DB SIZE` column.

---

## Exercise 4 — Compaction

**Goal:** understand what compaction does and what happens when a watch revision is compacted away.

### 4a. Generate revision history

Create and delete several objects to build up revision history:

```bash
for i in $(seq 1 20); do
  kubectl create configmap compact-test-$i --from-literal=i=$i
  kubectl delete configmap compact-test-$i --wait=false
done
```

Check the current revision:
```bash
CURRENT_REV=$(etcdctl endpoint status --write-out=json | jq '.[0].Status.header.revision')
echo "Current revision: $CURRENT_REV"
```

### 4b. Compact to the current revision

```bash
etcdctl compact $CURRENT_REV
```

### 4c. Try to read a revision before the compaction point

Pick any revision before `$CURRENT_REV`:

```bash
OLD_REV=$((CURRENT_REV - 50))
etcdctl get /registry/configmaps/default/mvcc-test --rev=$OLD_REV
```

**Expected error:**
```
{"level":"warn","ts":"...","msg":"failed to obtain lease from etcd","error":"etcdserver: mvcc: required revision has been compacted"}
```

This is the same error a controller's informer receives when its `resourceVersion` is too old — it triggers a full re-list.

### 4d. Defragment after compaction

Compaction marks space as reclaimable but doesn't return it to the filesystem. Defragmentation does:

```bash
# Check size before
etcdctl endpoint status --write-out=table

etcdctl defrag

# Check size after
etcdctl endpoint status --write-out=table
```

**Note:** defrag holds an exclusive lock on the database — it will briefly block all writes. In production, defrag one node at a time, not all at once.

---

## Exercise 5 — Snapshot and restore

**Goal:** take a snapshot and restore it to a new data directory.

### 5a. Take a snapshot

```bash
etcdctl snapshot save /tmp/etcd-lab-snapshot.db
etcdctl snapshot status /tmp/etcd-lab-snapshot.db --write-out=table
```

### 5b. Create objects that won't exist after restore

```bash
kubectl create configmap post-snapshot --from-literal=shouldnt=exist
kubectl get configmap post-snapshot
```

### 5c. Restore the snapshot

Stop the kind cluster's etcd (this is a lab — in production, you'd stop the full control plane):

```bash
# Get the etcd container in the kind control-plane node
docker exec etcd-lab-control-plane sh -c '
  ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-lab-snapshot.db \
    --data-dir /var/lib/etcd-restored \
    --name etcd-lab-control-plane \
    --initial-cluster etcd-lab-control-plane=https://127.0.0.1:2380 \
    --initial-advertise-peer-urls https://127.0.0.1:2380
'
```

**Note:** fully swapping the data directory requires restarting etcd inside the kind node — this is intentionally left as observation-only in this lab. The goal is to see what `snapshot restore` produces.

```bash
# List the restored data directory contents
docker exec etcd-lab-control-plane ls /var/lib/etcd-restored/
```

---

## Exercise 6 — Simulate quorum loss (observation)

**Goal:** understand what happens to the API server when etcd is unavailable.

### 6a. Pause etcd

```bash
# Pause the etcd process inside the kind node (simulates etcd outage)
docker exec etcd-lab-control-plane sh -c 'kill -STOP $(pgrep etcd)'
```

### 6b. Try API server operations

In a separate terminal:

```bash
# Write should fail
kubectl create configmap quorum-test --from-literal=x=1
# Expected: Error from server: etcdserver: request timed out

# Read may temporarily succeed (cached) or fail
kubectl get pods -n kube-system
```

### 6c. Restore etcd

```bash
docker exec etcd-lab-control-plane sh -c 'kill -CONT $(pgrep etcd)'

# Wait for the API server to reconnect
sleep 10
kubectl get pods -n kube-system
```

---

## Cleanup

```bash
kind delete cluster --name etcd-lab
rm -f /tmp/etcd-lab-env.sh /tmp/etcd-lab-snapshot.db
```

---

## Review questions

1. Why is `resourceVersion` a cluster-wide revision rather than a per-object counter?
2. What triggers a full re-list in a controller informer?
3. Why must defragmentation be done one node at a time in a production cluster?
4. On EKS, how would you diagnose an etcd pressure issue without `etcdctl`?
5. A 5-node etcd cluster has 2 nodes down. Can the cluster still accept writes? Why?
