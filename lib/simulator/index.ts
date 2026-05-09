import yaml from "js-yaml";
import type {
  ClusterState,
  SimNode,
  SimPod,
  SimDeployment,
  SimReplicaSet,
  SimService,
  SimConfigMap,
  SimSecret,
  SimNamespace,
  SimPersistentVolume,
  SimPersistentVolumeClaim,
  SimStorageClass,
  Labels,
} from "./types";
import { generateUid, labelsMatch } from "./utils";
import {
  reconcileDeployments,
  reconcileReplicaSets,
  reconcilePersistentVolumeClaims,
  schedulePods,
  updatePodStatus,
} from "./reconciler";

type StateListener = (state: ClusterState) => void;

function defaultState(): ClusterState {
  return {
    tick: 0,
    nodes: [
      {
        kind: "Node",
        metadata: {
          name: "sim-node-1",
          labels: { "kubernetes.io/hostname": "sim-node-1", "node-role.kubernetes.io/worker": "true" },
          uid: "node-1",
          creationTimestamp: Date.now(),
        },
        spec: {},
        status: {
          phase: "Ready",
          allocatable: { cpu: 4000, memory: 8192 },
          capacity: { cpu: 4000, memory: 8192 },
          addresses: [{ type: "InternalIP", address: "10.0.0.1" }],
        },
      },
      {
        kind: "Node",
        metadata: {
          name: "sim-node-2",
          labels: { "kubernetes.io/hostname": "sim-node-2", "node-role.kubernetes.io/worker": "true" },
          uid: "node-2",
          creationTimestamp: Date.now(),
        },
        spec: {},
        status: {
          phase: "Ready",
          allocatable: { cpu: 4000, memory: 8192 },
          capacity: { cpu: 4000, memory: 8192 },
          addresses: [{ type: "InternalIP", address: "10.0.0.2" }],
        },
      },
    ],
    pods: [],
    deployments: [],
    replicaSets: [],
    services: [],
    configMaps: [],
    secrets: [],
    persistentVolumes: [],
    persistentVolumeClaims: [],
    storageClasses: [],
    namespaces: [],
    events: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyManifest(state: ClusterState, doc: any): void {
  const kind: string = doc.kind;
  const name: string = doc.metadata?.name;
  const namespace: string = doc.metadata?.namespace ?? "default";

  if (!kind || !name) throw new Error("Manifest missing kind or metadata.name");

  switch (kind) {
    case "Pod": {
      const existing = state.pods.findIndex(
        (p) => p.metadata.name === name && p.metadata.namespace === namespace
      );
      const pod: SimPod = {
        kind: "Pod",
        apiVersion: "v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.pods[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.pods[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          containers: doc.spec?.containers ?? [],
          restartPolicy: doc.spec?.restartPolicy ?? "Always",
          nodeSelector: doc.spec?.nodeSelector,
        },
        status:
          existing >= 0
            ? {
                // Re-apply keeps existing status but resets phase/containers to trigger re-reconcile
                ...state.pods[existing].status,
                phase: "Pending",
                _tick: state.tick,
                _scheduledTick: undefined,
                _runningTick: undefined,
                containerStatuses: (doc.spec?.containers ?? []).map((c: { name: string; image: string }) => ({
                  name: c.name,
                  image: c.image,
                  ready: false,
                  restartCount: 0,
                  state: { type: "waiting", reason: "ContainerCreating" },
                })),
              }
            : {
                phase: "Pending",
                containerStatuses: (doc.spec?.containers ?? []).map((c: { name: string; image: string }) => ({
                  name: c.name,
                  image: c.image,
                  ready: false,
                  restartCount: 0,
                  state: { type: "waiting", reason: "ContainerCreating" },
                })),
                _tick: state.tick,
              },
      };
      if (existing >= 0) {
        state.pods[existing] = pod;
      } else {
        state.pods.push(pod);
      }
      break;
    }

    case "Deployment": {
      const existing = state.deployments.findIndex(
        (d) => d.metadata.name === name && d.metadata.namespace === namespace
      );
      const deploy: SimDeployment = {
        kind: "Deployment",
        apiVersion: "apps/v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.deployments[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.deployments[existing].metadata.creationTimestamp : Date.now(),
          generation: existing >= 0 ? state.deployments[existing].metadata.generation + 1 : 1,
        },
        spec: {
          replicas: doc.spec?.replicas ?? 1,
          selector: doc.spec?.selector ?? { matchLabels: {} },
          template: doc.spec?.template ?? { metadata: { labels: {} }, spec: { containers: [] } },
          strategy: doc.spec?.strategy,
        },
        status: { replicas: 0, readyReplicas: 0, updatedReplicas: 0, availableReplicas: 0, observedGeneration: 0 },
      };
      if (existing >= 0) {
        state.deployments[existing] = deploy;
      } else {
        state.deployments.push(deploy);
      }
      break;
    }

    case "Service": {
      const existing = state.services.findIndex(
        (s) => s.metadata.name === name && s.metadata.namespace === namespace
      );
      const svc: SimService = {
        kind: "Service",
        apiVersion: "v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.services[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.services[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          selector: doc.spec?.selector,
          ports: doc.spec?.ports ?? [],
          type: doc.spec?.type ?? "ClusterIP",
          clusterIP: doc.spec?.clusterIP ?? `10.96.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        },
        status: {},
      };
      if (existing >= 0) {
        state.services[existing] = svc;
      } else {
        state.services.push(svc);
      }
      break;
    }

    case "ConfigMap": {
      const existing = state.configMaps.findIndex(
        (c) => c.metadata.name === name && c.metadata.namespace === namespace
      );
      const cm: SimConfigMap = {
        kind: "ConfigMap",
        apiVersion: "v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.configMaps[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.configMaps[existing].metadata.creationTimestamp : Date.now(),
        },
        data: doc.data,
      };
      if (existing >= 0) state.configMaps[existing] = cm;
      else state.configMaps.push(cm);
      break;
    }

    case "Secret": {
      const existing = state.secrets.findIndex(
        (s) => s.metadata.name === name && s.metadata.namespace === namespace
      );
      const secret: SimSecret = {
        kind: "Secret",
        apiVersion: "v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.secrets[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.secrets[existing].metadata.creationTimestamp : Date.now(),
        },
        data: doc.data,
        type: doc.type ?? "Opaque",
      };
      if (existing >= 0) state.secrets[existing] = secret;
      else state.secrets.push(secret);
      break;
    }

    case "Namespace": {
      const existing = state.namespaces.findIndex((n) => n.metadata.name === name);
      const ns: SimNamespace = {
        kind: "Namespace",
        apiVersion: "v1",
        metadata: {
          name,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.namespaces[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.namespaces[existing].metadata.creationTimestamp : Date.now(),
        },
        status: { phase: "Active" },
      };
      if (existing >= 0) state.namespaces[existing] = ns;
      else state.namespaces.push(ns);
      break;
    }

    case "PersistentVolume": {
      const existing = state.persistentVolumes.findIndex((pv) => pv.metadata.name === name);
      const pv: SimPersistentVolume = {
        kind: "PersistentVolume",
        apiVersion: "v1",
        metadata: {
          name,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.persistentVolumes[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.persistentVolumes[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          capacity: doc.spec?.capacity ?? { storage: "1Gi" },
          accessModes: doc.spec?.accessModes ?? ["ReadWriteOnce"],
          storageClassName: doc.spec?.storageClassName,
          hostPath: doc.spec?.hostPath,
          persistentVolumeReclaimPolicy: doc.spec?.persistentVolumeReclaimPolicy ?? "Retain",
        },
        status: { phase: existing >= 0 ? state.persistentVolumes[existing].status.phase : "Available" },
      };
      if (existing >= 0) state.persistentVolumes[existing] = pv;
      else state.persistentVolumes.push(pv);
      break;
    }

    case "PersistentVolumeClaim": {
      const existing = state.persistentVolumeClaims.findIndex(
        (pvc) => pvc.metadata.name === name && pvc.metadata.namespace === namespace
      );
      const pvc: SimPersistentVolumeClaim = {
        kind: "PersistentVolumeClaim",
        apiVersion: "v1",
        metadata: {
          name,
          namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.persistentVolumeClaims[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.persistentVolumeClaims[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          accessModes: doc.spec?.accessModes ?? ["ReadWriteOnce"],
          resources: doc.spec?.resources ?? { requests: { storage: "1Gi" } },
          storageClassName: doc.spec?.storageClassName,
          volumeName: doc.spec?.volumeName,
        },
        status: { phase: existing >= 0 ? state.persistentVolumeClaims[existing].status.phase : "Pending" },
      };
      if (existing >= 0) state.persistentVolumeClaims[existing] = pvc;
      else state.persistentVolumeClaims.push(pvc);
      break;
    }

    case "StorageClass": {
      const existing = state.storageClasses.findIndex((sc) => sc.metadata.name === name);
      const sc: SimStorageClass = {
        kind: "StorageClass",
        apiVersion: "storage.k8s.io/v1",
        metadata: {
          name,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.storageClasses[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.storageClasses[existing].metadata.creationTimestamp : Date.now(),
          annotations: doc.metadata?.annotations,
        },
        provisioner: doc.provisioner ?? "kubernetes.io/no-provisioner",
        volumeBindingMode: doc.volumeBindingMode ?? "Immediate",
        reclaimPolicy: doc.reclaimPolicy ?? "Delete",
        allowVolumeExpansion: doc.allowVolumeExpansion,
      };
      if (existing >= 0) state.storageClasses[existing] = sc;
      else state.storageClasses.push(sc);
      break;
    }

    default:
      break;
  }
}

export class ClusterSimulator {
  private state: ClusterState;
  private listeners: StateListener[] = [];

  constructor(initial?: Partial<ClusterState>) {
    this.state = { ...defaultState(), ...(initial ?? {}) };
  }

  /** Apply one or more YAML manifests (multi-doc separated by ---) */
  apply(rawYaml: string): void {
    const docs = yaml.loadAll(rawYaml) as unknown[];
    for (const doc of docs) {
      if (doc && typeof doc === "object") {
        applyManifest(this.state, doc);
      }
    }
    this.tick(); // Immediate tick so UI feels responsive
    this.notify();
  }

  /** Run one reconciliation cycle */
  tick(): void {
    this.state.tick++;
    reconcileDeployments(this.state);
    reconcileReplicaSets(this.state);
    reconcilePersistentVolumeClaims(this.state);
    schedulePods(this.state);
    updatePodStatus(this.state);
    this.notify();
  }

  getState(): Readonly<ClusterState> {
    return this.state;
  }

  getPods(filter?: { namespace?: string; labelSelector?: Labels }): SimPod[] {
    return this.state.pods.filter((p) => {
      if (filter?.namespace && p.metadata.namespace !== filter.namespace) return false;
      if (filter?.labelSelector && !labelsMatch(filter.labelSelector, p.metadata.labels)) return false;
      return true;
    });
  }

  getDeployments(namespace?: string): SimDeployment[] {
    return namespace ? this.state.deployments.filter((d) => d.metadata.namespace === namespace) : this.state.deployments;
  }

  getServices(namespace?: string): SimService[] {
    return namespace ? this.state.services.filter((s) => s.metadata.namespace === namespace) : this.state.services;
  }

  getNodes(): SimNode[] {
    return this.state.nodes;
  }

  getConfigMaps(namespace?: string): SimConfigMap[] {
    return namespace
      ? this.state.configMaps.filter((c) => c.metadata.namespace === namespace)
      : this.state.configMaps;
  }

  getSecrets(namespace?: string): SimSecret[] {
    return namespace
      ? this.state.secrets.filter((s) => s.metadata.namespace === namespace)
      : this.state.secrets;
  }

  getNamespaces(): SimNamespace[] {
    return this.state.namespaces;
  }

  getPersistentVolumes(): SimPersistentVolume[] {
    return this.state.persistentVolumes;
  }

  getPersistentVolumeClaims(namespace?: string): SimPersistentVolumeClaim[] {
    return namespace
      ? this.state.persistentVolumeClaims.filter((pvc) => pvc.metadata.namespace === namespace)
      : this.state.persistentVolumeClaims;
  }

  getStorageClasses(): SimStorageClass[] {
    return this.state.storageClasses;
  }

  getEvents(): ClusterState["events"] {
    return this.state.events;
  }

  /** Return pods that a service's selector would route to */
  getServiceEndpoints(serviceName: string, namespace = "default"): SimPod[] {
    const svc = this.state.services.find(
      (s) => s.metadata.name === serviceName && s.metadata.namespace === namespace
    );
    if (!svc?.spec.selector) return [];
    return this.state.pods.filter(
      (p) =>
        p.metadata.namespace === namespace &&
        p.status.phase === "Running" &&
        labelsMatch(svc.spec.selector!, p.metadata.labels)
    );
  }

  /** Reset cluster to empty state (keeps default nodes) */
  reset(): void {
    this.state = defaultState();
    this.notify();
  }

  serialize(): string {
    return JSON.stringify(this.state);
  }

  static deserialize(json: string): ClusterSimulator {
    return new ClusterSimulator(JSON.parse(json) as ClusterState);
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    const snapshot = structuredClone(this.state);
    for (const l of this.listeners) l(snapshot);
  }
}
