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
  SimStatefulSet,
  SimDaemonSet,
  SimJob,
  SimCronJob,
  SimIngress,
  SimServiceAccount,
  SimRole,
  SimClusterRole,
  SimRoleBinding,
  SimHPA,
  SimNetworkPolicy,
  SimPodDisruptionBudget,
  SimCRD,
  SimCustomResource,
  Labels,
} from "./types";
import { generateUid, labelsMatch } from "./utils";
import {
  reconcileDeployments,
  reconcileReplicaSets,
  reconcilePersistentVolumeClaims,
  reconcileStatefulSets,
  reconcileDaemonSets,
  reconcileJobs,
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
        spec: { taints: [] },
        status: {
          phase: "Ready",
          allocatable: { cpu: 2000, memory: 8192 },
          capacity: { cpu: 2000, memory: 8192 },
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
        spec: { taints: [] },
        status: {
          phase: "Ready",
          allocatable: { cpu: 2000, memory: 8192 },
          capacity: { cpu: 2000, memory: 8192 },
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
    statefulSets: [],
    daemonSets: [],
    jobs: [],
    cronJobs: [],
    ingresses: [],
    serviceAccounts: [],
    roles: [],
    clusterRoles: [],
    roleBindings: [],
    hpas: [],
    events: [],
    networkPolicies: [],
    podDisruptionBudgets: [],
    customResourceDefinitions: [],
    customResources: [],
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

    case "StatefulSet": {
      const existing = state.statefulSets.findIndex((s) => s.metadata.name === name && s.metadata.namespace === namespace);
      const ss: SimStatefulSet = {
        kind: "StatefulSet", apiVersion: "apps/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.statefulSets[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.statefulSets[existing].metadata.creationTimestamp : Date.now() },
        spec: { replicas: doc.spec?.replicas ?? 1, selector: doc.spec?.selector ?? { matchLabels: {} }, serviceName: doc.spec?.serviceName ?? name, template: doc.spec?.template ?? { metadata: { labels: {} }, spec: { containers: [] } }, volumeClaimTemplates: doc.spec?.volumeClaimTemplates },
        status: { replicas: 0, readyReplicas: 0, currentReplicas: 0 },
      };
      if (existing >= 0) state.statefulSets[existing] = ss; else state.statefulSets.push(ss);
      break;
    }

    case "DaemonSet": {
      const existing = state.daemonSets.findIndex((d) => d.metadata.name === name && d.metadata.namespace === namespace);
      const ds: SimDaemonSet = {
        kind: "DaemonSet", apiVersion: "apps/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.daemonSets[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.daemonSets[existing].metadata.creationTimestamp : Date.now() },
        spec: { selector: doc.spec?.selector ?? { matchLabels: {} }, template: doc.spec?.template ?? { metadata: { labels: {} }, spec: { containers: [] } } },
        status: { desiredNumberScheduled: 0, numberReady: 0, numberAvailable: 0 },
      };
      if (existing >= 0) state.daemonSets[existing] = ds; else state.daemonSets.push(ds);
      break;
    }

    case "Job": {
      const existing = state.jobs.findIndex((j) => j.metadata.name === name && j.metadata.namespace === namespace);
      const job: SimJob = {
        kind: "Job", apiVersion: "batch/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.jobs[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.jobs[existing].metadata.creationTimestamp : Date.now() },
        spec: { completions: doc.spec?.completions ?? 1, parallelism: doc.spec?.parallelism ?? 1, template: doc.spec?.template ?? { metadata: { labels: {} }, spec: { containers: [], restartPolicy: "Never" } } },
        status: existing >= 0 ? state.jobs[existing].status : { active: 0, succeeded: 0, failed: 0 },
      };
      if (existing >= 0) state.jobs[existing] = job; else state.jobs.push(job);
      break;
    }

    case "CronJob": {
      const existing = state.cronJobs.findIndex((c) => c.metadata.name === name && c.metadata.namespace === namespace);
      const cj: SimCronJob = {
        kind: "CronJob", apiVersion: "batch/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.cronJobs[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.cronJobs[existing].metadata.creationTimestamp : Date.now() },
        spec: { schedule: doc.spec?.schedule ?? "0 * * * *", jobTemplate: doc.spec?.jobTemplate ?? { spec: { template: { spec: { containers: [], restartPolicy: "Never" } } } }, suspend: doc.spec?.suspend },
        status: {},
      };
      if (existing >= 0) state.cronJobs[existing] = cj; else state.cronJobs.push(cj);
      break;
    }

    case "Ingress": {
      const existing = state.ingresses.findIndex((i) => i.metadata.name === name && i.metadata.namespace === namespace);
      const ing: SimIngress = {
        kind: "Ingress", apiVersion: "networking.k8s.io/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.ingresses[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.ingresses[existing].metadata.creationTimestamp : Date.now(), annotations: doc.metadata?.annotations },
        spec: { ingressClassName: doc.spec?.ingressClassName, rules: doc.spec?.rules, tls: doc.spec?.tls },
        status: {},
      };
      if (existing >= 0) state.ingresses[existing] = ing; else state.ingresses.push(ing);
      break;
    }

    case "ServiceAccount": {
      const existing = state.serviceAccounts.findIndex((s) => s.metadata.name === name && s.metadata.namespace === namespace);
      const sa: SimServiceAccount = {
        kind: "ServiceAccount", apiVersion: "v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.serviceAccounts[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.serviceAccounts[existing].metadata.creationTimestamp : Date.now() },
      };
      if (existing >= 0) state.serviceAccounts[existing] = sa; else state.serviceAccounts.push(sa);
      break;
    }

    case "Role": {
      const existing = state.roles.findIndex((r) => r.metadata.name === name && r.metadata.namespace === namespace);
      const role: SimRole = {
        kind: "Role", apiVersion: "rbac.authorization.k8s.io/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.roles[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.roles[existing].metadata.creationTimestamp : Date.now() },
        rules: doc.rules ?? [],
      };
      if (existing >= 0) state.roles[existing] = role; else state.roles.push(role);
      break;
    }

    case "ClusterRole": {
      const existing = state.clusterRoles.findIndex((r) => r.metadata.name === name);
      const cr: SimClusterRole = {
        kind: "ClusterRole", apiVersion: "rbac.authorization.k8s.io/v1",
        metadata: { name, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.clusterRoles[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.clusterRoles[existing].metadata.creationTimestamp : Date.now() },
        rules: doc.rules ?? [],
      };
      if (existing >= 0) state.clusterRoles[existing] = cr; else state.clusterRoles.push(cr);
      break;
    }

    case "RoleBinding": {
      const existing = state.roleBindings.findIndex((r) => r.metadata.name === name && r.metadata.namespace === namespace);
      const rb: SimRoleBinding = {
        kind: "RoleBinding", apiVersion: "rbac.authorization.k8s.io/v1",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.roleBindings[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.roleBindings[existing].metadata.creationTimestamp : Date.now() },
        subjects: doc.subjects ?? [],
        roleRef: doc.roleRef ?? { kind: "Role", name: "", apiGroup: "rbac.authorization.k8s.io" },
      };
      if (existing >= 0) state.roleBindings[existing] = rb; else state.roleBindings.push(rb);
      break;
    }

    case "HorizontalPodAutoscaler": {
      const existing = state.hpas.findIndex((h) => h.metadata.name === name && h.metadata.namespace === namespace);
      const hpa: SimHPA = {
        kind: "HorizontalPodAutoscaler", apiVersion: "autoscaling/v2",
        metadata: { name, namespace, labels: doc.metadata?.labels ?? {}, uid: existing >= 0 ? state.hpas[existing].metadata.uid : generateUid(), creationTimestamp: existing >= 0 ? state.hpas[existing].metadata.creationTimestamp : Date.now() },
        spec: { scaleTargetRef: doc.spec?.scaleTargetRef ?? { apiVersion: "apps/v1", kind: "Deployment", name: "" }, minReplicas: doc.spec?.minReplicas ?? 1, maxReplicas: doc.spec?.maxReplicas ?? 10, metrics: doc.spec?.metrics },
        status: { currentReplicas: 0, desiredReplicas: 0 },
      };
      if (existing >= 0) state.hpas[existing] = hpa; else state.hpas.push(hpa);
      break;
    }

    case "Node": {
      const idx = state.nodes.findIndex((n) => n.metadata.name === name);
      if (idx !== -1) {
        state.nodes[idx] = {
          ...state.nodes[idx],
          spec: { ...state.nodes[idx].spec, ...(doc.spec ?? {}) },
        };
      }
      break;
    }

    case "NetworkPolicy": {
      const existing = state.networkPolicies.findIndex(
        (n) => n.metadata.name === name && n.metadata.namespace === namespace
      );
      const np: SimNetworkPolicy = {
        kind: "NetworkPolicy",
        apiVersion: "networking.k8s.io/v1",
        metadata: {
          name, namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.networkPolicies[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.networkPolicies[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          podSelector: doc.spec?.podSelector ?? {},
          policyTypes: doc.spec?.policyTypes,
          ingress: doc.spec?.ingress,
          egress: doc.spec?.egress,
        },
      };
      if (existing >= 0) state.networkPolicies[existing] = np;
      else state.networkPolicies.push(np);
      break;
    }

    case "PodDisruptionBudget": {
      const existing = state.podDisruptionBudgets.findIndex(
        (p) => p.metadata.name === name && p.metadata.namespace === namespace
      );
      const pdb: SimPodDisruptionBudget = {
        kind: "PodDisruptionBudget",
        apiVersion: "policy/v1",
        metadata: {
          name, namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.podDisruptionBudgets[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.podDisruptionBudgets[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          selector: doc.spec?.selector ?? { matchLabels: {} },
          minAvailable: doc.spec?.minAvailable,
          maxUnavailable: doc.spec?.maxUnavailable,
        },
        status: { currentHealthy: 0, desiredHealthy: 0, disruptionsAllowed: 0, expectedPods: 0 },
      };
      if (existing >= 0) state.podDisruptionBudgets[existing] = pdb;
      else state.podDisruptionBudgets.push(pdb);
      break;
    }

    case "CustomResourceDefinition": {
      const existing = state.customResourceDefinitions.findIndex((c) => c.metadata.name === name);
      const crd: SimCRD = {
        kind: "CustomResourceDefinition",
        apiVersion: "apiextensions.k8s.io/v1",
        metadata: {
          name,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.customResourceDefinitions[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.customResourceDefinitions[existing].metadata.creationTimestamp : Date.now(),
        },
        spec: {
          group: doc.spec?.group ?? "",
          names: doc.spec?.names ?? { kind: "", plural: "" },
          scope: doc.spec?.scope ?? "Namespaced",
          versions: doc.spec?.versions ?? [{ name: "v1", served: true, storage: true }],
        },
        status: { acceptedNames: doc.spec?.names, conditions: [{ type: "Established", status: "True" }] },
      };
      if (existing >= 0) state.customResourceDefinitions[existing] = crd;
      else state.customResourceDefinitions.push(crd);
      break;
    }

    default: {
      // Generic custom resource — store verbatim for verifier inspection
      const existing = state.customResources.findIndex(
        (r) => r.kind === kind && r.metadata.name === name && (r.metadata.namespace ?? "default") === namespace
      );
      const cr: SimCustomResource = {
        kind,
        apiVersion: doc.apiVersion ?? "",
        metadata: {
          name,
          namespace: doc.metadata?.namespace,
          labels: doc.metadata?.labels ?? {},
          uid: existing >= 0 ? state.customResources[existing].metadata.uid : generateUid(),
          creationTimestamp: existing >= 0 ? state.customResources[existing].metadata.creationTimestamp : Date.now(),
          annotations: doc.metadata?.annotations,
        },
        spec: doc.spec ?? {},
        status: doc.status,
      };
      if (existing >= 0) state.customResources[existing] = cr;
      else state.customResources.push(cr);
      break;
    }
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
    reconcileStatefulSets(this.state);
    reconcileDaemonSets(this.state);
    reconcileJobs(this.state);
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

  getStatefulSets(namespace?: string): SimStatefulSet[] {
    return namespace ? this.state.statefulSets.filter((s) => s.metadata.namespace === namespace) : this.state.statefulSets;
  }

  getDaemonSets(namespace?: string): SimDaemonSet[] {
    return namespace ? this.state.daemonSets.filter((d) => d.metadata.namespace === namespace) : this.state.daemonSets;
  }

  getJobs(namespace?: string): SimJob[] {
    return namespace ? this.state.jobs.filter((j) => j.metadata.namespace === namespace) : this.state.jobs;
  }

  getCronJobs(namespace?: string): SimCronJob[] {
    return namespace ? this.state.cronJobs.filter((c) => c.metadata.namespace === namespace) : this.state.cronJobs;
  }

  getIngresses(namespace?: string): SimIngress[] {
    return namespace ? this.state.ingresses.filter((i) => i.metadata.namespace === namespace) : this.state.ingresses;
  }

  getServiceAccounts(namespace?: string): SimServiceAccount[] {
    return namespace ? this.state.serviceAccounts.filter((s) => s.metadata.namespace === namespace) : this.state.serviceAccounts;
  }

  getRoles(namespace?: string): SimRole[] {
    return namespace ? this.state.roles.filter((r) => r.metadata.namespace === namespace) : this.state.roles;
  }

  getClusterRoles(): SimClusterRole[] {
    return this.state.clusterRoles;
  }

  getRoleBindings(namespace?: string): SimRoleBinding[] {
    return namespace ? this.state.roleBindings.filter((r) => r.metadata.namespace === namespace) : this.state.roleBindings;
  }

  getHPAs(namespace?: string): SimHPA[] {
    return namespace ? this.state.hpas.filter((h) => h.metadata.namespace === namespace) : this.state.hpas;
  }

  getNetworkPolicies(namespace?: string): SimNetworkPolicy[] {
    return namespace
      ? this.state.networkPolicies.filter((n) => n.metadata.namespace === namespace)
      : this.state.networkPolicies;
  }

  getPodDisruptionBudgets(namespace?: string): SimPodDisruptionBudget[] {
    return namespace
      ? this.state.podDisruptionBudgets.filter((p) => p.metadata.namespace === namespace)
      : this.state.podDisruptionBudgets;
  }

  getCRDs(): SimCRD[] {
    return this.state.customResourceDefinitions;
  }

  getCustomResources(kind?: string, namespace?: string): SimCustomResource[] {
    return this.state.customResources.filter((r) => {
      if (kind && r.kind !== kind) return false;
      if (namespace && r.metadata.namespace && r.metadata.namespace !== namespace) return false;
      return true;
    });
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
