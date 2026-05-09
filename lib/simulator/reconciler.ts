import type {
  ClusterState,
  SimDeployment,
  SimReplicaSet,
  SimPod,
  ContainerSpec,
  ClusterEvent,
  Labels,
  SimPersistentVolume,
} from "./types";
import { generateUid, labelsMatch, templateHash, willCrash } from "./utils";

// Ticks until a pod moves from Pending → has node assigned
const SCHEDULE_TICKS = 2;
// Ticks after scheduling until containers start (Pending → Running/CrashLoop)
const START_TICKS = 3;
// Ticks before CrashLoopBackOff shows up (gives time for first restart)
const CRASH_BACKOFF_TICKS = 4;

function emitEvent(
  state: ClusterState,
  type: "Normal" | "Warning",
  reason: string,
  message: string,
  involved: { kind: string; name: string; namespace?: string }
) {
  state.events.unshift({
    uid: generateUid(),
    type,
    reason,
    message,
    involvedObject: involved,
    timestamp: Date.now(),
  });
  // keep last 100 events
  if (state.events.length > 100) state.events.length = 100;
}

function rsTemplateHash(rs: SimReplicaSet): string {
  return templateHash(rs.spec.template.spec.containers);
}

function deployTemplateHash(deploy: SimDeployment): string {
  return templateHash(deploy.spec.template.spec.containers);
}

function resolveCount(value: number | string | undefined, total: number): number {
  if (value === undefined) return 1;
  if (typeof value === "number") return value;
  if (value.endsWith("%")) return Math.ceil((parseInt(value) / 100) * total);
  return parseInt(value, 10);
}

function makePod(
  namespace: string,
  generateName: string,
  labels: Labels,
  containers: ContainerSpec[],
  nodeSelector: Labels | undefined,
  ownerRef: { kind: string; name: string; uid: string },
  tick: number
): SimPod {
  return {
    kind: "Pod",
    apiVersion: "v1",
    metadata: {
      name: `${generateName}-${Math.random().toString(36).slice(2, 7)}`,
      namespace,
      labels,
      uid: generateUid(),
      creationTimestamp: Date.now(),
      ownerReference: ownerRef,
    },
    spec: {
      containers,
      restartPolicy: "Always",
      nodeSelector,
    },
    status: {
      phase: "Pending",
      containerStatuses: containers.map((c) => ({
        name: c.name,
        image: c.image,
        ready: false,
        restartCount: 0,
        state: { type: "waiting", reason: "ContainerCreating" },
      })),
      _tick: tick,
    },
  };
}

/** Bind PVCs to PVs or trigger dynamic provisioning via StorageClass */
export function reconcilePersistentVolumeClaims(state: ClusterState): void {
  for (const pvc of state.persistentVolumeClaims) {
    if (pvc.status.phase === "Bound") continue;

    // Try to bind to an explicitly named PV first
    if (pvc.spec.volumeName) {
      const pv = state.persistentVolumes.find(
        (v) => v.metadata.name === pvc.spec.volumeName && v.status.phase === "Available"
      );
      if (pv) {
        pvc.status.phase = "Bound";
        pvc.status.capacity = pv.spec.capacity;
        pvc.status.accessModes = pv.spec.accessModes;
        pv.status.phase = "Bound";
        emitEvent(state, "Normal", "Bound", `PVC ${pvc.metadata.name} bound to PV ${pv.metadata.name}`, {
          kind: "PersistentVolumeClaim",
          name: pvc.metadata.name,
          namespace: pvc.metadata.namespace,
        });
      }
      continue;
    }

    // Find a matching available PV by storageClass and access modes
    const matchingPV = state.persistentVolumes.find((pv: SimPersistentVolume) => {
      if (pv.status.phase !== "Available") return false;
      if (pvc.spec.storageClassName !== undefined && pv.spec.storageClassName !== pvc.spec.storageClassName) return false;
      const pvcModes = new Set(pvc.spec.accessModes);
      return pv.spec.accessModes.some((m) => pvcModes.has(m));
    });

    if (matchingPV) {
      pvc.status.phase = "Bound";
      pvc.status.capacity = matchingPV.spec.capacity;
      pvc.status.accessModes = matchingPV.spec.accessModes;
      pvc.spec.volumeName = matchingPV.metadata.name;
      matchingPV.status.phase = "Bound";
      emitEvent(state, "Normal", "Bound", `PVC ${pvc.metadata.name} bound to PV ${matchingPV.metadata.name}`, {
        kind: "PersistentVolumeClaim",
        name: pvc.metadata.name,
        namespace: pvc.metadata.namespace,
      });
      continue;
    }

    // Dynamic provisioning: if a StorageClass with Immediate binding exists, simulate provisioning
    if (pvc.spec.storageClassName) {
      const sc = state.storageClasses.find(
        (s) => s.metadata.name === pvc.spec.storageClassName && (s.volumeBindingMode ?? "Immediate") === "Immediate"
      );
      if (sc) {
        const pvName = `pvc-${pvc.metadata.uid.slice(0, 8)}`;
        const newPV: SimPersistentVolume = {
          kind: "PersistentVolume",
          apiVersion: "v1",
          metadata: {
            name: pvName,
            labels: {},
            uid: pvc.metadata.uid + "-pv",
            creationTimestamp: Date.now(),
          },
          spec: {
            capacity: pvc.spec.resources.requests,
            accessModes: pvc.spec.accessModes,
            storageClassName: pvc.spec.storageClassName,
            persistentVolumeReclaimPolicy: sc.reclaimPolicy ?? "Delete",
          },
          status: { phase: "Bound" },
        };
        state.persistentVolumes.push(newPV);
        pvc.status.phase = "Bound";
        pvc.status.capacity = newPV.spec.capacity;
        pvc.status.accessModes = newPV.spec.accessModes;
        pvc.spec.volumeName = pvName;
        emitEvent(state, "Normal", "ProvisioningSucceeded", `PVC ${pvc.metadata.name} dynamically provisioned`, {
          kind: "PersistentVolumeClaim",
          name: pvc.metadata.name,
          namespace: pvc.metadata.namespace,
        });
      }
    }
  }
}

/** Reconcile Deployments → ReplicaSets */
export function reconcileDeployments(state: ClusterState): void {
  for (const deploy of state.deployments) {
    const desired = deploy.spec.replicas;
    const hash = deployTemplateHash(deploy);

    // Find the "active" RS matching the current template
    let activeRS = state.replicaSets.find(
      (rs) =>
        rs.metadata.ownerReference?.uid === deploy.metadata.uid &&
        rs.metadata.templateHash === hash
    );

    if (!activeRS) {
      // Create a new RS for the new template
      const rsName = `${deploy.metadata.name}-${hash.slice(0, 5)}`;
      activeRS = {
        kind: "ReplicaSet",
        apiVersion: "apps/v1",
        metadata: {
          name: rsName,
          namespace: deploy.metadata.namespace,
          labels: { ...deploy.spec.template.metadata.labels, "pod-template-hash": hash.slice(0, 5) },
          uid: generateUid(),
          creationTimestamp: Date.now(),
          ownerReference: { kind: "Deployment", name: deploy.metadata.name, uid: deploy.metadata.uid },
          templateHash: hash,
        },
        spec: {
          replicas: 0, // start at 0; rolling logic below sets it
          selector: deploy.spec.selector,
          template: deploy.spec.template,
        },
        status: { replicas: 0, readyReplicas: 0, availableReplicas: 0 },
      };
      state.replicaSets.push(activeRS);
      emitEvent(state, "Normal", "ScalingReplicaSet", `Scaled up replica set ${rsName} to ${desired}`, {
        kind: "Deployment",
        name: deploy.metadata.name,
        namespace: deploy.metadata.namespace,
      });
    }

    // Old RSes for this deployment (different template hash)
    const oldRSes = state.replicaSets.filter(
      (rs) =>
        rs.metadata.ownerReference?.uid === deploy.metadata.uid &&
        rs.metadata.templateHash !== hash
    );

    const strategyType = deploy.spec.strategy?.type ?? "RollingUpdate";

    if (strategyType === "Recreate") {
      // Scale old RSes down to 0 first
      for (const rs of oldRSes) rs.spec.replicas = 0;
      const totalOldRunning = oldRSes.reduce((s, rs) => {
        const rsPods = state.pods.filter(
          (p) => p.metadata.ownerReference?.uid === rs.metadata.uid && p.status.phase === "Running"
        );
        return s + rsPods.length;
      }, 0);
      if (totalOldRunning === 0) activeRS.spec.replicas = desired;
    } else {
      // Rolling update
      const maxSurge = resolveCount(deploy.spec.strategy?.rollingUpdate?.maxSurge, desired);
      const maxUnavailable = resolveCount(deploy.spec.strategy?.rollingUpdate?.maxUnavailable, desired);

      const currentReady = state.pods.filter(
        (p) => p.metadata.ownerReference?.uid === activeRS!.metadata.uid && p.status.phase === "Running"
      ).length;

      // Scale up new RS gradually
      const maxTotal = desired + maxSurge;
      const newTarget = Math.min(maxTotal, desired + Math.max(0, desired - currentReady));
      activeRS.spec.replicas = newTarget;

      // Scale down old RSes
      for (const rs of oldRSes) {
        const oldRunning = state.pods.filter(
          (p) => p.metadata.ownerReference?.uid === rs.metadata.uid && p.status.phase === "Running"
        ).length;
        const minAvailable = desired - maxUnavailable;
        rs.spec.replicas = Math.max(0, minAvailable - currentReady);
        if (oldRunning === 0) rs.spec.replicas = 0;
      }

      // Once new RS is fully scaled up, set it to exactly desired
      if (currentReady >= desired) activeRS.spec.replicas = desired;
    }

    // Update deployment status
    const activePods = state.pods.filter(
      (p) => p.metadata.ownerReference?.uid === activeRS!.metadata.uid
    );
    deploy.status.replicas = activePods.length;
    deploy.status.readyReplicas = activePods.filter((p) => p.status.phase === "Running").length;
    deploy.status.updatedReplicas = activePods.filter((p) => p.status.phase === "Running").length;
    deploy.status.availableReplicas = deploy.status.readyReplicas;
    deploy.status.observedGeneration = deploy.metadata.generation;
  }
}

/** Reconcile ReplicaSets → Pods */
export function reconcileReplicaSets(state: ClusterState): void {
  for (const rs of state.replicaSets) {
    const ownedPods = state.pods.filter((p) => p.metadata.ownerReference?.uid === rs.metadata.uid);
    const activePods = ownedPods.filter((p) => p.status.phase !== "Succeeded" && p.status.phase !== "Failed");
    const diff = rs.spec.replicas - activePods.length;

    if (diff > 0) {
      // Create missing pods
      for (let i = 0; i < diff; i++) {
        const pod = makePod(
          rs.metadata.namespace,
          rs.metadata.name,
          { ...rs.spec.template.metadata.labels, "pod-template-hash": rs.metadata.templateHash.slice(0, 5) },
          rs.spec.template.spec.containers,
          rs.spec.template.spec.nodeSelector,
          { kind: "ReplicaSet", name: rs.metadata.name, uid: rs.metadata.uid },
          state.tick
        );
        state.pods.push(pod);
        emitEvent(state, "Normal", "SuccessfulCreate", `Created pod: ${pod.metadata.name}`, {
          kind: "ReplicaSet",
          name: rs.metadata.name,
          namespace: rs.metadata.namespace,
        });
      }
    } else if (diff < 0) {
      // Delete excess pods (prefer Pending ones first)
      const toDelete = activePods
        .sort((a, b) => {
          if (a.status.phase === "Pending" && b.status.phase !== "Pending") return -1;
          if (b.status.phase === "Pending" && a.status.phase !== "Pending") return 1;
          return a.metadata.creationTimestamp - b.metadata.creationTimestamp;
        })
        .slice(0, -diff);
      for (const pod of toDelete) {
        state.pods = state.pods.filter((p) => p.metadata.uid !== pod.metadata.uid);
        emitEvent(state, "Normal", "SuccessfulDelete", `Deleted pod: ${pod.metadata.name}`, {
          kind: "ReplicaSet",
          name: rs.metadata.name,
          namespace: rs.metadata.namespace,
        });
      }
    }

    // Update RS status
    const remaining = state.pods.filter((p) => p.metadata.ownerReference?.uid === rs.metadata.uid);
    rs.status.replicas = remaining.length;
    rs.status.readyReplicas = remaining.filter((p) => p.status.phase === "Running").length;
    rs.status.availableReplicas = rs.status.readyReplicas;
  }
}

/** Schedule Pending pods without a node assignment */
export function schedulePods(state: ClusterState): void {
  const readyNodes = state.nodes.filter((n) => n.status.phase === "Ready");
  if (readyNodes.length === 0) return;

  for (const pod of state.pods) {
    if (pod.status.phase !== "Pending" || pod.spec.nodeName) continue;
    if (state.tick - pod.status._tick < SCHEDULE_TICKS) continue;

    // Respect nodeSelector
    const candidates = pod.spec.nodeSelector
      ? readyNodes.filter((n) => labelsMatch(pod.spec.nodeSelector!, n.metadata.labels))
      : readyNodes;

    if (candidates.length === 0) {
      emitEvent(state, "Warning", "FailedScheduling", "No nodes match nodeSelector", {
        kind: "Pod",
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
      });
      continue;
    }

    const node = candidates[Math.floor(Math.random() * candidates.length)];
    pod.spec.nodeName = node.metadata.name;
    pod.status._scheduledTick = state.tick;
    emitEvent(state, "Normal", "Scheduled", `Successfully assigned to node ${node.metadata.name}`, {
      kind: "Pod",
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
    });
  }
}

/** Advance pod state machine: Pending → Running | CrashLoopBackOff */
export function updatePodStatus(state: ClusterState): void {
  for (const pod of state.pods) {
    if (pod.status.phase === "Running" || pod.status.phase === "Succeeded" || pod.status.phase === "Failed") {
      // Check for CrashLoopBackOff — re-evaluate if spec changed
      const crashing = pod.spec.containers.some((c) => willCrash(c));
      if (!crashing && pod.status.containerStatuses.some((cs) => cs.state.reason === "CrashLoopBackOff")) {
        // Command was fixed — restart the pod fresh
        pod.status.phase = "Pending";
        pod.status._tick = state.tick;
        pod.status._scheduledTick = undefined;
        pod.status._runningTick = undefined;
        pod.spec.nodeName = undefined;
        pod.status.containerStatuses = pod.spec.containers.map((c) => ({
          name: c.name,
          image: c.image,
          ready: false,
          restartCount: 0,
          state: { type: "waiting", reason: "ContainerCreating" },
        }));
      }
      continue;
    }

    // Pod must be scheduled before containers start
    if (!pod.spec.nodeName) continue;

    const scheduledTick = pod.status._scheduledTick ?? state.tick;
    const ticksSinceScheduled = state.tick - scheduledTick;

    if (ticksSinceScheduled < START_TICKS) continue;

    const crashing = pod.spec.containers.some((c) => willCrash(c));

    if (crashing) {
      const ticksSinceStart = state.tick - (pod.status._runningTick ?? state.tick);
      if (!pod.status._runningTick) {
        pod.status._runningTick = state.tick;
      }
      if (ticksSinceStart >= CRASH_BACKOFF_TICKS) {
        pod.status.phase = "Running"; // phase stays Running but containers CrashLoop
        pod.status.containerStatuses = pod.spec.containers.map((c) => ({
          name: c.name,
          image: c.image,
          ready: false,
          restartCount: Math.floor(ticksSinceStart / CRASH_BACKOFF_TICKS),
          state: { type: "waiting", reason: "CrashLoopBackOff", message: "Back-off restarting failed container" },
        }));
        emitEvent(state, "Warning", "BackOff", `Back-off restarting failed container in pod ${pod.metadata.name}`, {
          kind: "Pod",
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
        });
      }
    } else {
      pod.status.phase = "Running";
      pod.status._runningTick = pod.status._runningTick ?? state.tick;
      pod.status.containerStatuses = pod.spec.containers.map((c) => ({
        name: c.name,
        image: c.image,
        ready: true,
        restartCount: 0,
        state: { type: "running" },
      }));
    }
  }
}
