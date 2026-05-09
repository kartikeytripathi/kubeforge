export type Labels = Record<string, string>;

export type PodPhase = "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";

export type PodConditionType = "PodScheduled" | "ContainersReady" | "Initialized" | "Ready";

export interface ContainerPort {
  containerPort: number;
  protocol?: "TCP" | "UDP";
  name?: string;
}

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    configMapKeyRef?: { name: string; key: string };
    secretKeyRef?: { name: string; key: string };
  };
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

export interface Volume {
  name: string;
  configMap?: { name: string };
  secret?: { secretName: string };
  persistentVolumeClaim?: { claimName: string };
  emptyDir?: Record<string, never>;
}

export interface ResourceList {
  cpu?: string;
  memory?: string;
}

export interface ContainerSpec {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  ports?: ContainerPort[];
  env?: EnvVar[];
  volumeMounts?: VolumeMount[];
  resources?: {
    requests?: ResourceList;
    limits?: ResourceList;
  };
}

export type ContainerStateType = "waiting" | "running" | "terminated";

export interface ContainerStatus {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  state: {
    type: ContainerStateType;
    reason?: string;
    message?: string;
  };
}

export interface SimPod {
  kind: "Pod";
  apiVersion: "v1";
  metadata: {
    name: string;
    namespace: string;
    labels: Labels;
    uid: string;
    creationTimestamp: number;
    ownerReference?: { kind: string; name: string; uid: string };
  };
  spec: {
    containers: ContainerSpec[];
    restartPolicy: "Always" | "OnFailure" | "Never";
    nodeName?: string;
    nodeSelector?: Labels;
    volumes?: Volume[];
  };
  status: {
    phase: PodPhase;
    containerStatuses: ContainerStatus[];
    podIP?: string;
    hostIP?: string;
    startTime?: number;
    _tick: number;
    _scheduledTick?: number;
    _runningTick?: number;
  };
}

export interface SimDeployment {
  kind: "Deployment";
  apiVersion: "apps/v1";
  metadata: {
    name: string;
    namespace: string;
    labels: Labels;
    uid: string;
    creationTimestamp: number;
    generation: number;
  };
  spec: {
    replicas: number;
    selector: { matchLabels: Labels };
    template: {
      metadata: { labels: Labels };
      spec: {
        containers: ContainerSpec[];
        restartPolicy?: "Always";
        nodeSelector?: Labels;
        volumes?: Volume[];
      };
    };
    strategy?: {
      type: "RollingUpdate" | "Recreate";
      rollingUpdate?: {
        maxSurge?: number | string;
        maxUnavailable?: number | string;
      };
    };
  };
  status: {
    replicas: number;
    readyReplicas: number;
    updatedReplicas: number;
    availableReplicas: number;
    observedGeneration: number;
  };
}

export interface SimReplicaSet {
  kind: "ReplicaSet";
  apiVersion: "apps/v1";
  metadata: {
    name: string;
    namespace: string;
    labels: Labels;
    uid: string;
    creationTimestamp: number;
    ownerReference?: { kind: "Deployment"; name: string; uid: string };
    templateHash: string;
  };
  spec: {
    replicas: number;
    selector: { matchLabels: Labels };
    template: {
      metadata: { labels: Labels };
      spec: {
        containers: ContainerSpec[];
        nodeSelector?: Labels;
        volumes?: Volume[];
      };
    };
  };
  status: {
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
  };
}

export interface ServicePort {
  port: number;
  targetPort?: number | string;
  protocol?: "TCP" | "UDP";
  name?: string;
  nodePort?: number;
}

export interface SimService {
  kind: "Service";
  apiVersion: "v1";
  metadata: {
    name: string;
    namespace: string;
    labels: Labels;
    uid: string;
    creationTimestamp: number;
  };
  spec: {
    selector?: Labels;
    ports: ServicePort[];
    type: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
    clusterIP?: string;
  };
  status: {
    loadBalancer?: { ingress?: { ip: string }[] };
  };
}

export interface SimNode {
  kind: "Node";
  metadata: {
    name: string;
    labels: Labels;
    uid: string;
    creationTimestamp: number;
  };
  spec: {
    taints?: { key: string; effect: string; value?: string }[];
  };
  status: {
    phase: "Ready" | "NotReady";
    allocatable: { cpu: number; memory: number };
    capacity: { cpu: number; memory: number };
    addresses: { type: string; address: string }[];
  };
}

export interface SimConfigMap {
  kind: "ConfigMap";
  apiVersion: "v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  data?: Record<string, string>;
}

export interface SimSecret {
  kind: "Secret";
  apiVersion: "v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  data?: Record<string, string>;
  type?: string;
}

export type PVCPhase = "Pending" | "Bound" | "Released" | "Failed";
export type PVPhase = "Available" | "Bound" | "Released" | "Failed";

export interface SimPersistentVolumeClaim {
  kind: "PersistentVolumeClaim";
  apiVersion: "v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    accessModes: string[];
    resources: { requests: { storage: string } };
    storageClassName?: string;
    volumeName?: string;
  };
  status: {
    phase: PVCPhase;
    capacity?: { storage: string };
    accessModes?: string[];
  };
}

export interface SimPersistentVolume {
  kind: "PersistentVolume";
  apiVersion: "v1";
  metadata: { name: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    capacity: { storage: string };
    accessModes: string[];
    storageClassName?: string;
    hostPath?: { path: string };
    persistentVolumeReclaimPolicy?: "Retain" | "Recycle" | "Delete";
  };
  status: { phase: PVPhase };
}

export interface SimStorageClass {
  kind: "StorageClass";
  apiVersion: "storage.k8s.io/v1";
  metadata: { name: string; labels: Labels; uid: string; creationTimestamp: number; annotations?: Record<string, string> };
  provisioner: string;
  volumeBindingMode?: "Immediate" | "WaitForFirstConsumer";
  reclaimPolicy?: "Retain" | "Delete";
  allowVolumeExpansion?: boolean;
}

export interface SimNamespace {
  kind: "Namespace";
  apiVersion: "v1";
  metadata: { name: string; labels: Labels; uid: string; creationTimestamp: number };
  status: { phase: "Active" | "Terminating" };
}

export interface ClusterEvent {
  uid: string;
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  involvedObject: { kind: string; name: string; namespace?: string };
  timestamp: number;
}

export interface ClusterState {
  tick: number;
  nodes: SimNode[];
  pods: SimPod[];
  deployments: SimDeployment[];
  replicaSets: SimReplicaSet[];
  services: SimService[];
  configMaps: SimConfigMap[];
  secrets: SimSecret[];
  persistentVolumes: SimPersistentVolume[];
  persistentVolumeClaims: SimPersistentVolumeClaim[];
  storageClasses: SimStorageClass[];
  namespaces: SimNamespace[];
  events: ClusterEvent[];
}
