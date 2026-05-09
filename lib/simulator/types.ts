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
    reason?: string; // "CrashLoopBackOff" | "Error" | "OOMKilled" | "ImagePullBackOff"
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
  };
  status: {
    phase: PodPhase;
    containerStatuses: ContainerStatus[];
    podIP?: string;
    hostIP?: string;
    startTime?: number;
    // internal sim fields
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
    allocatable: { cpu: number; memory: number }; // cpu in millicores, memory in MiB
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
  events: ClusterEvent[];
}
