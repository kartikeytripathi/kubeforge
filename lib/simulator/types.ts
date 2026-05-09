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

export interface ProbeSpec {
  httpGet?: { path: string; port: number | string };
  tcpSocket?: { port: number | string };
  exec?: { command: string[] };
  initialDelaySeconds?: number;
  periodSeconds?: number;
  failureThreshold?: number;
}

export interface Toleration {
  key?: string;
  operator?: "Exists" | "Equal";
  value?: string;
  effect?: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
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
  livenessProbe?: ProbeSpec;
  readinessProbe?: ProbeSpec;
  startupProbe?: ProbeSpec;
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
    tolerations?: Toleration[];
    serviceAccountName?: string;
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

// ─── Phase B types ────────────────────────────────────────────────────────────

export interface SimStatefulSet {
  kind: "StatefulSet";
  apiVersion: "apps/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    replicas: number;
    selector: { matchLabels: Labels };
    serviceName: string;
    template: {
      metadata: { labels: Labels };
      spec: { containers: ContainerSpec[]; nodeSelector?: Labels; volumes?: Volume[]; tolerations?: Toleration[] };
    };
    volumeClaimTemplates?: {
      metadata: { name: string };
      spec: { accessModes: string[]; resources: { requests: { storage: string } }; storageClassName?: string };
    }[];
  };
  status: { replicas: number; readyReplicas: number; currentReplicas: number };
}

export interface SimDaemonSet {
  kind: "DaemonSet";
  apiVersion: "apps/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    selector: { matchLabels: Labels };
    template: {
      metadata: { labels: Labels };
      spec: { containers: ContainerSpec[]; nodeSelector?: Labels; tolerations?: Toleration[] };
    };
  };
  status: { desiredNumberScheduled: number; numberReady: number; numberAvailable: number };
}

export interface SimJob {
  kind: "Job";
  apiVersion: "batch/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    completions?: number;
    parallelism?: number;
    template: {
      metadata: { labels: Labels };
      spec: { containers: ContainerSpec[]; restartPolicy: "Never" | "OnFailure" };
    };
  };
  status: { active: number; succeeded: number; failed: number; completionTime?: number };
}

export interface SimCronJob {
  kind: "CronJob";
  apiVersion: "batch/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    schedule: string;
    jobTemplate: {
      spec: {
        template: {
          spec: { containers: ContainerSpec[]; restartPolicy: "Never" | "OnFailure" };
        };
      };
    };
    suspend?: boolean;
  };
  status: { lastScheduleTime?: number };
}

export interface IngressRule {
  host?: string;
  http: {
    paths: {
      path: string;
      pathType: "Prefix" | "Exact" | "ImplementationSpecific";
      backend: { service: { name: string; port: { number: number } } };
    }[];
  };
}

export interface SimIngress {
  kind: "Ingress";
  apiVersion: "networking.k8s.io/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number; annotations?: Record<string, string> };
  spec: { ingressClassName?: string; rules?: IngressRule[]; tls?: { hosts: string[]; secretName: string }[] };
  status: { loadBalancer?: { ingress?: { ip: string }[] } };
}

export interface SimServiceAccount {
  kind: "ServiceAccount";
  apiVersion: "v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
}

export interface PolicyRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
}

export interface SimRole {
  kind: "Role";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  rules: PolicyRule[];
}

export interface SimClusterRole {
  kind: "ClusterRole";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: { name: string; labels: Labels; uid: string; creationTimestamp: number };
  rules: PolicyRule[];
}

export interface SimRoleBinding {
  kind: "RoleBinding";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  subjects: { kind: "ServiceAccount" | "User" | "Group"; name: string; namespace?: string }[];
  roleRef: { kind: "Role" | "ClusterRole"; name: string; apiGroup: string };
}

export interface SimHPA {
  kind: "HorizontalPodAutoscaler";
  apiVersion: "autoscaling/v2";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    scaleTargetRef: { apiVersion: string; kind: string; name: string };
    minReplicas: number;
    maxReplicas: number;
    metrics?: {
      type: "Resource";
      resource: { name: string; target: { type: "Utilization"; averageUtilization: number } };
    }[];
  };
  status: { currentReplicas: number; desiredReplicas: number };
}

export interface ClusterEvent {
  uid: string;
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  involvedObject: { kind: string; name: string; namespace?: string };
  timestamp: number;
}

// ─── Phase C / D types ────────────────────────────────────────────────────────

export interface NetworkPolicyPort {
  protocol?: "TCP" | "UDP";
  port?: number | string;
}

export interface NetworkPolicyPeer {
  podSelector?: { matchLabels?: Labels };
  namespaceSelector?: { matchLabels?: Labels };
  ipBlock?: { cidr: string; except?: string[] };
}

export interface SimNetworkPolicy {
  kind: "NetworkPolicy";
  apiVersion: "networking.k8s.io/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    podSelector: { matchLabels?: Labels };
    policyTypes?: ("Ingress" | "Egress")[];
    ingress?: { from?: NetworkPolicyPeer[]; ports?: NetworkPolicyPort[] }[];
    egress?: { to?: NetworkPolicyPeer[]; ports?: NetworkPolicyPort[] }[];
  };
}

export interface SimPodDisruptionBudget {
  kind: "PodDisruptionBudget";
  apiVersion: "policy/v1";
  metadata: { name: string; namespace: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    selector: { matchLabels: Labels };
    minAvailable?: number | string;
    maxUnavailable?: number | string;
  };
  status: { currentHealthy: number; desiredHealthy: number; disruptionsAllowed: number; expectedPods: number };
}

export interface SimCRD {
  kind: "CustomResourceDefinition";
  apiVersion: "apiextensions.k8s.io/v1";
  metadata: { name: string; labels: Labels; uid: string; creationTimestamp: number };
  spec: {
    group: string;
    names: { kind: string; plural: string; singular?: string };
    scope: "Namespaced" | "Cluster";
    versions: { name: string; served: boolean; storage: boolean }[];
  };
  status: { acceptedNames?: { kind: string; plural: string }; conditions?: { type: string; status: string }[] };
}

/** Generic store for any CRD instance or unknown resource kind */
export interface SimCustomResource {
  kind: string;
  apiVersion: string;
  metadata: { name: string; namespace?: string; labels: Labels; uid: string; creationTimestamp: number; annotations?: Record<string, string> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status?: Record<string, any>;
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
  statefulSets: SimStatefulSet[];
  daemonSets: SimDaemonSet[];
  jobs: SimJob[];
  cronJobs: SimCronJob[];
  ingresses: SimIngress[];
  serviceAccounts: SimServiceAccount[];
  roles: SimRole[];
  clusterRoles: SimClusterRole[];
  roleBindings: SimRoleBinding[];
  hpas: SimHPA[];
  events: ClusterEvent[];
  // Phase C / D extensions
  networkPolicies: SimNetworkPolicy[];
  podDisruptionBudgets: SimPodDisruptionBudget[];
  customResourceDefinitions: SimCRD[];
  customResources: SimCustomResource[];
}
