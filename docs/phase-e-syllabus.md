# Phase E — K8s Internals Track · Syllabus Spec

> **Status:** design · not yet implemented  
> **Parent issue:** [#10 — K8s Internals Mastery integration](https://github.com/kartikeytripathi/kubeforge/issues/10)  
> **Planned lab IDs:** E1 – E10  
> **Target phase label:** "Phase E — Internals"

---

## Purpose

Phases A–D teach *what* to configure and *how* to fix it. Phase E teaches *why* it broke and *which layer of the stack* is responsible. Every lab maps 1:1 to one of the ten K8s Internals modules in `modules/`.

The learning outcome is the same as a CKA performance question, but the skill being tested is different: **component identification before YAML fix**, not YAML-pattern recall.

---

## New Lab Format — "Diagnostic Mode"

Phase E introduces a new YAML schema for the editor. Instead of a pure Kubernetes manifest, the starter contains a structured answer template:

```yaml
# ── Diagnosis ────────────────────────────────────────────────────────────────
# Fill in the component you believe is responsible for this failure.
# Options: api-server | etcd | controller-manager | scheduler | kubelet |
#          kube-proxy | cri-runtime | cni-plugin | admission-webhook | operator
diagnosis:
  failingComponent: ""        # which K8s component owns this failure
  failureStage: ""            # e.g. "authn" | "filter" | "reconcile" | "cni-add"

# ── Fix ───────────────────────────────────────────────────────────────────────
# Apply the Kubernetes manifest(s) that resolve the issue.
---
# your fix YAML goes here
```

**Verifier contract:** each E-lab verifier checks two blocks independently:
1. `diagnosis.failingComponent` and `diagnosis.failureStage` must match expected values
2. The fix YAML below the `---` separator must satisfy the existing objective assertions

This means a learner can get credit for the correct fix without the correct diagnosis (partial credit) or vice-versa, giving instructors a way to see which skill is weak.

### Parser note

`app/lesson/[id]/page.tsx` currently passes the raw YAML string to the verifier. No changes needed — the verifier can split on `---` to extract the diagnostic block and the fix block separately. A `parseDiagnosticYaml(raw: string)` utility in `lib/verifiers/utils.ts` should handle this.

---

## Lab Specifications

### E1 · Trace a rejected API call through the admission pipeline

| Field | Value |
|---|---|
| **Module** | 1 — API Request Lifecycle |
| **Difficulty** | intermediate |
| **Estimated time** | 25 min |
| **Real-world incident** | yes |

**Scenario:** A service account used by a CI pipeline suddenly can't create Pods in the `staging` namespace. `kubectl` returns `403 Forbidden`. The pipeline hasn't changed, but a new ValidatingWebhookConfiguration was added yesterday. Learners must identify whether the failure is at *authn*, *authz (RBAC)*, or *admission* — then fix the relevant object.

**Hidden setup:**
- ServiceAccount `ci-runner` with a ClusterRoleBinding that grants `pods/create` in all namespaces
- ValidatingWebhookConfiguration `staging-policy` with `namespaceSelector` that accidentally matches `staging` AND a `failurePolicy: Fail` pointing at a service that doesn't exist — causing all pod creation in `staging` to time out and fail

**Objectives:**
1. `diagnosis-correct` — `failingComponent: admission-webhook`, `failureStage: admission`
2. `webhook-scoped` — `namespaceSelector` excludes the `staging` namespace OR webhook `failurePolicy` is `Ignore`
3. `pods-can-be-created` — a Pod applied to `staging` is accepted by the simulator

**Internals link:** `modules/01-api-request-lifecycle/guide.md#authorization--rbac-and-beyond`

---

### E2 · Restore a ConfigMap from a past etcd revision

| Field | Value |
|---|---|
| **Module** | 2 — etcd & the Storage Layer |
| **Difficulty** | intermediate |
| **Estimated time** | 20 min |
| **Real-world incident** | yes |

**Scenario:** A hotfix script overwrote `config/feature-flags` ConfigMap in the `production` namespace, replacing `payment-v2: "true"` with `payment-v2: "false"`, causing a revenue regression. The cluster's etcd snapshot from 10 minutes ago still has the correct value. Learners identify that the failure owner is *etcd* (the authoritative store), then restore the ConfigMap to the correct value.

**Hidden setup:**
- ConfigMap `feature-flags` in `production` with `payment-v2: "false"` (the broken state)
- Simulator metadata includes a `previousRevision` field with the correct value for verifier use

**Objectives:**
1. `diagnosis-correct` — `failingComponent: etcd`, `failureStage: mvcc-restore`
2. `configmap-restored` — ConfigMap `feature-flags` in `production` has `payment-v2: "true"`

**Internals link:** `modules/02-etcd-storage/guide.md#mvcc-and-compaction`

---

### E3 · Break the ArgoCD reconcile storm

| Field | Value |
|---|---|
| **Module** | 3 — Controllers & Reconciliation |
| **Difficulty** | intermediate |
| **Estimated time** | 20 min |
| **Real-world incident** | yes |

**Scenario:** GitHub's API rate-limiter has banned the cluster's IP. ArgoCD's `repo-server` is sending 1,800 requests/hour because `timeout.reconciliation` is `2s`. Learners identify the failing component as *controller-manager* (reconcile loop owner), then fix the ArgoCD ConfigMap to use a sane interval and add `retry.backoff`.

**Hidden setup:**
- ArgoCD `argocd-cm` ConfigMap with `timeout.reconciliation: 2s` and no `retry.backoff`

**Objectives:**
1. `diagnosis-correct` — `failingComponent: controller-manager`, `failureStage: reconcile`
2. `interval-sane` — `timeout.reconciliation` ≥ 180s (3 min)
3. `backoff-set` — `retry.backoff.duration` and `retry.backoff.factor` are present

**Internals link:** `modules/03-controllers-reconciliation/guide.md#the-reconcile-loop-pattern`

---

### E4 · Unblock a pod from the scheduler filter phase

| Field | Value |
|---|---|
| **Module** | 4 — Scheduler Internals & Custom Plugins |
| **Difficulty** | intermediate |
| **Estimated time** | 20 min |
| **Real-world incident** | no |

**Scenario:** `payments-processor` has been `Pending` for 45 minutes. No events explain why. The learner must identify that the failure is in the *scheduler* at the *filter* phase (specifically `PodFitsResources`) — the pod requests 6 CPU but the largest node has 4. The fix is to reduce the CPU request.

**Hidden setup:**
- Node with 4 CPU allocatable
- Deployment requesting `cpu: "6"` per pod

**Objectives:**
1. `diagnosis-correct` — `failingComponent: scheduler`, `failureStage: filter`
2. `cpu-fits-node` — pod CPU request ≤ 4000m
3. `pod-scheduled` — pod transitions to Running

**Internals link:** `modules/04-scheduler-internals/guide.md#the-scheduling-cycle--filter-and-score`

---

### E5 · Diagnose a PLEG timeout causing NodeNotReady

| Field | Value |
|---|---|
| **Module** | 5 — Kubelet, PLEG & Node Lifecycle |
| **Difficulty** | advanced |
| **Estimated time** | 25 min |
| **Real-world incident** | yes |

**Scenario:** `worker-node-3` is cycling between `Ready` and `NotReady` every ~5 minutes. `journalctl` shows `PLEG is not healthy` and `relist took longer than expected`. The container runtime is overloaded with 200+ containers. Learners identify the failing component as *kubelet* at the *pleg-relist* stage, then fix the issue by applying a NodeTaint to drain non-critical pods and a kubelet ConfigMap patch to increase `podPidsLimit`.

**Hidden setup:**
- Node with `conditions[Ready]=Unknown` cycling
- DaemonSet placing 200 containers on the node

**Objectives:**
1. `diagnosis-correct` — `failingComponent: kubelet`, `failureStage: pleg-relist`
2. `node-tainted` — node has a `NoSchedule` or `NoExecute` taint to stop new pods landing
3. `pids-limit-increased` — kubelet ConfigMap `podPidsLimit` ≥ 65536

**Internals link:** `modules/05-kubelet-pleg/guide.md#pleg-and-node-lifecycle-events`

---

### E6 · Fix a CNI misconfiguration causing pod networking failures

| Field | Value |
|---|---|
| **Module** | 6 — CRI, CNI, CSI — The Three Interfaces |
| **Difficulty** | advanced |
| **Estimated time** | 25 min |
| **Real-world incident** | yes |

**Scenario:** A new node pool was added. Pods on those nodes start but can't reach cluster Services. `kubectl exec` succeeds but DNS resolution fails. The CNI ConfigMap has a `clusterCIDR` that overlaps with the VPC CIDR. Learners identify the failure as *cni-plugin* at the *cni-add* stage, then fix the CNI ConfigMap with the correct non-overlapping CIDR.

**Hidden setup:**
- CNI ConfigMap with `clusterCIDR: 10.0.0.0/16` (overlapping with VPC)
- Pod in `Running` state but with `status.podIP` routing to the wrong subnet

**Objectives:**
1. `diagnosis-correct` — `failingComponent: cni-plugin`, `failureStage: cni-add`
2. `cidr-non-overlapping` — CNI ConfigMap `clusterCIDR` uses `192.168.0.0/16` or `172.16.0.0/12`
3. `pod-reachable` — simulator confirms pod can reach Service ClusterIP

**Internals link:** `modules/06-cri-cni-csi/guide.md#cni--container-network-interface`

---

### E7 · Identify the slow webhook in a multi-webhook chain

| Field | Value |
|---|---|
| **Module** | 7 — Admission Control & CEL Policy |
| **Difficulty** | intermediate |
| **Estimated time** | 20 min |
| **Real-world incident** | yes |

**Scenario:** Three `ValidatingWebhookConfigurations` are registered: `security-policy`, `cost-policy`, and `compliance-check`. Pod creation in the `finance` namespace takes 28–35 seconds. Only `compliance-check` has `timeoutSeconds: 30` and no `namespaceSelector`. Learners must identify the culprit webhook (without being told which one) and scope it correctly.

**Hidden setup:**
- Three webhooks, two with `timeoutSeconds: 5` and proper `namespaceSelector`, one with `timeoutSeconds: 30` and no selector

**Objectives:**
1. `diagnosis-correct` — `failingComponent: admission-webhook`, `failureStage: admission`
2. `compliance-timeout-reduced` — `compliance-check` webhook `timeoutSeconds` ≤ 10
3. `compliance-scoped` — `compliance-check` has a `namespaceSelector` targeting `finance`

**Internals link:** `modules/07-admission-control/guide.md#validating-admission-webhooks`

---

### E8 · Resolve a CRD ownership conflict between two operators

| Field | Value |
|---|---|
| **Module** | 8 — CRDs, Operators & controller-runtime |
| **Difficulty** | advanced |
| **Estimated time** | 30 min |
| **Real-world incident** | yes |

**Scenario:** Two operators — `payments-operator` v1 (legacy) and `payments-operator` v2 (new rollout) — are both watching the same `PaymentsConfig` CRD. v1 keeps reverting `spec.replicaCount` back to 3 every time v2 sets it to 5. The spec field oscillates every 2–3 seconds. Learners must identify this as an *operator* ownership conflict, then disable the v1 operator Deployment.

**Hidden setup:**
- Two Deployments watching the same CRD
- CRD `paymentsconfigs.kubeforge.io` with oscillating `spec.replicaCount`

**Objectives:**
1. `diagnosis-correct` — `failingComponent: operator`, `failureStage: reconcile`
2. `legacy-operator-disabled` — `payments-operator-v1` Deployment `replicas: 0`
3. `spec-stable` — `paymentsconfigs/main` `spec.replicaCount` is 5

**Internals link:** `modules/08-crds-operators/guide.md#crd-registration-and-the-extension-api-server`

---

### E9 · Trace a broken Service through kube-proxy rules

| Field | Value |
|---|---|
| **Module** | 9 — Networking Internals & kube-proxy Modes |
| **Difficulty** | advanced |
| **Estimated time** | 25 min |
| **Real-world incident** | no |

**Scenario:** `cart-service` ClusterIP `10.96.45.100` is unreachable. `kubectl get endpoints cart-service` returns `<none>`. The Service exists and the Deployment is Running. Learners must trace the failure to *kube-proxy* not having any iptables rules for the Service because there are no matching Endpoints — caused by a label selector mismatch. The fix is correcting the selector.

**Hidden setup:**
- Service `cart-service` with `selector: app: cart-api`
- Deployment with labels `app: cart` (mismatched — missing the `-api` suffix)

**Objectives:**
1. `diagnosis-correct` — `failingComponent: kube-proxy`, `failureStage: iptables-no-endpoints`
2. `selector-matches` — Service selector matches Deployment pod template labels
3. `endpoints-populated` — simulator confirms at least one Endpoint for `cart-service`

**Internals link:** `modules/09-networking-internals/guide.md#kube-proxy-and-iptables-rules`

---

### E10 · Plan a zero-downtime etcd member replacement

| Field | Value |
|---|---|
| **Module** | 10 — HA, Upgrades & Cluster Lifecycle |
| **Difficulty** | advanced |
| **Estimated time** | 30 min |
| **Real-world incident** | yes |

**Scenario:** A 3-node etcd cluster has one member with a failing disk (SMART errors). The cluster must remain at quorum (2/3 members healthy) throughout the replacement. Learners must identify the failure as an *etcd* quorum risk at the *member-replacement* stage, then apply PodDisruptionBudgets and drain annotations in the correct order to keep quorum intact.

**Hidden setup:**
- 3-node StatefulSet simulating etcd members, one with a `Taint: disk-failure=true:NoSchedule`
- No PDB applied

**Objectives:**
1. `diagnosis-correct` — `failingComponent: etcd`, `failureStage: member-replacement`
2. `pdb-applied` — PodDisruptionBudget `etcd-quorum-pdb` with `minAvailable: 2`
3. `failed-node-drained` — the failing node has `kubectl drain` annotation set
4. `quorum-maintained` — at no point do fewer than 2 etcd pods show `Running` during the replacement sequence

**Internals link:** `modules/10-ha-upgrades/guide.md#cluster-upgrades-and-node-draining`

---

## Implementation Checklist

### New shared utilities needed

- [ ] `lib/verifiers/utils.ts` — `parseDiagnosticYaml(raw: string): { diagnosis: Record<string, string>; fixYaml: string }` — splits the combined editor content on `---`
- [ ] Update `YamlEditor.tsx` — Phase E starter YAMLs have a comment header block before the first `---`; Monaco should set `yaml` mode (already does) but the editor height may need a larger default
- [ ] Add `"e1"…"e10"` to `VALID_LAB_IDS` in `lib/labs.ts`
- [ ] Add E-phase block to curriculum page (`app/curriculum/page.tsx`)
- [ ] Update lab count on `LandingPage.tsx` and `app/curriculum/page.tsx` (39 → 49)

### Per-lab files (×10)

For each `eN`:
- [ ] `content/labs/eN.json` — lab definition with the two-block starter YAML
- [ ] `lib/verifiers/eN.ts` — verifier that calls `parseDiagnosticYaml` and checks both blocks
- [ ] Import + register `verifyEN` in `app/lesson/[id]/LessonClient.tsx`
- [ ] Add entry to `lib/lab-module-map.ts` and `content/lab-mapping.csv`

### Module guides

Phase E labs reference all 10 module guides. Before launching Phase E, all 10 `modules/*/guide.md` files should be published (or the `isModuleLive` gate updated per module). Currently only Module 2 is live — Module 1 is the next priority.

### Simulator extensions needed

| Lab | Simulator gap | Notes |
|---|---|---|
| E1 | Webhook `failurePolicy` rejection simulation | Currently webhooks stored but not enforced during `apply()` |
| E2 | MVCC revision history on CustomResources | Low priority — may be verifier-only (check submitted YAML data directly) |
| E5 | Node condition cycling (Ready → NotReady) | New `NodeCondition` simulation tick |
| E6 | Pod networking reachability checks | `getEndpoints(svc)` already exists; need CIDR validation |
| E10 | PDB enforcement during StatefulSet drain | PDB model exists; drain sequencing not implemented |

---

## Sequencing Recommendation

| Order | Lab | Reason |
|---|---|---|
| 1st | E2 | Module 2 guide is already live; verifier can be purely YAML-based (no sim changes) |
| 2nd | E4 | Scheduler filter simulation already works (b2, c3 use it); low sim cost |
| 3rd | E3 | ArgoCD reconcile — ConfigMap-based verifier, no sim gaps |
| 4th | E7 | Multi-webhook chain — extends c10 simulator patterns |
| Later | E1, E5, E6, E8, E9, E10 | Require simulator extensions |

---

## Open questions

1. **Partial credit UI** — how does `VerifyPanel` show a lab where diagnosis is wrong but fix is correct? Current UI is all-pass / mixed. Consider a two-section objective list: `Diagnosis` and `Fix` headers.
2. **Hint strategy** — E-labs need two tiers of hints: one that nudges toward the right component without naming it, and one that explains *why* that component owns this failure. Should hints be split into `diagnosisHint` / `fixHint` in the JSON schema?
3. **Phase gate** — should Phase E require Phase D completion, or be independently accessible? Given the advanced difficulty, a gate at D9+ makes sense.
4. **Module guide dependency** — should the "Why this works →" footer show a warning if the module guide is not yet published, rather than a "soon" badge?
