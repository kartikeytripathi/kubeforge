import { describe, it, expect, beforeEach } from "vitest";
import { ClusterSimulator } from "@/lib/simulator";

const POD_YAML = `
apiVersion: v1
kind: Pod
metadata:
  name: webapp
  namespace: default
  labels:
    app: webapp
spec:
  restartPolicy: Always
  containers:
  - name: app
    image: nginx:1.25
    ports:
    - containerPort: 80
`;

const CRASHING_POD_YAML = `
apiVersion: v1
kind: Pod
metadata:
  name: webapp
  namespace: default
  labels:
    app: webapp
spec:
  restartPolicy: Always
  containers:
  - name: app
    image: nginx:1.25
    command: ["/wrong-command"]
`;

const DEPLOYMENT_YAML = (image: string, replicas = 3) => `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: default
  labels:
    app: frontend
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: web
        image: ${image}
        ports:
        - containerPort: 80
`;

const SERVICE_YAML = (selector: string) => `
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: ${selector}
  ports:
  - port: 80
    targetPort: 80
`;

function tickN(sim: ClusterSimulator, n: number) {
  for (let i = 0; i < n; i++) sim.tick();
}

describe("ClusterSimulator — pod lifecycle", () => {
  let sim: ClusterSimulator;

  beforeEach(() => {
    sim = new ClusterSimulator();
  });

  it("starts with 2 ready nodes", () => {
    expect(sim.getNodes()).toHaveLength(2);
    expect(sim.getNodes().every((n) => n.status.phase === "Ready")).toBe(true);
  });

  it("creates a pod in Pending state after apply", () => {
    sim.apply(POD_YAML);
    const pods = sim.getPods({ namespace: "default" });
    expect(pods).toHaveLength(1);
    expect(pods[0].metadata.name).toBe("webapp");
    expect(pods[0].status.phase).toBe("Pending");
  });

  it("transitions pod to Running after enough ticks", () => {
    sim.apply(POD_YAML);
    tickN(sim, 10);
    const pods = sim.getPods({ namespace: "default" });
    expect(pods[0].status.phase).toBe("Running");
  });

  it("scheduled pod has a nodeName assigned", () => {
    sim.apply(POD_YAML);
    tickN(sim, 5);
    const pod = sim.getPods({ namespace: "default" })[0];
    expect(pod.spec.nodeName).toBeTruthy();
    const nodeNames = sim.getNodes().map((n) => n.metadata.name);
    expect(nodeNames).toContain(pod.spec.nodeName);
  });

  it("pod with bad command enters CrashLoopBackOff", () => {
    sim.apply(CRASHING_POD_YAML);
    tickN(sim, 20);
    const pod = sim.getPods({ namespace: "default" })[0];
    const crashing = pod.status.containerStatuses.some(
      (cs) => cs.state.reason === "CrashLoopBackOff"
    );
    expect(crashing).toBe(true);
  });

  it("fixing the command recovers the pod from CrashLoopBackOff", () => {
    sim.apply(CRASHING_POD_YAML);
    tickN(sim, 20);

    // Fix the command
    sim.apply(POD_YAML);
    tickN(sim, 15);

    const pod = sim.getPods({ namespace: "default" })[0];
    expect(pod.status.phase).toBe("Running");
    const crashing = pod.status.containerStatuses.some(
      (cs) => cs.state.reason === "CrashLoopBackOff"
    );
    expect(crashing).toBe(false);
  });
});

describe("ClusterSimulator — Deployment → ReplicaSet → Pod chain", () => {
  let sim: ClusterSimulator;

  beforeEach(() => {
    sim = new ClusterSimulator();
  });

  it("creates a ReplicaSet from a Deployment", () => {
    sim.apply(DEPLOYMENT_YAML("nginx:1.21"));
    tickN(sim, 2);
    const rsets = sim.getState().replicaSets;
    expect(rsets).toHaveLength(1);
    expect(rsets[0].metadata.ownerReference?.name).toBe("frontend");
  });

  it("creates 3 pods for replicas: 3", () => {
    sim.apply(DEPLOYMENT_YAML("nginx:1.21", 3));
    tickN(sim, 15);
    const pods = sim.getPods({ namespace: "default" });
    expect(pods).toHaveLength(3);
    expect(pods.every((p) => p.status.phase === "Running")).toBe(true);
  });

  it("rolling update creates new RS and replaces pods", () => {
    sim.apply(DEPLOYMENT_YAML("nginx:1.21", 3));
    tickN(sim, 15);

    sim.apply(DEPLOYMENT_YAML("nginx:1.25", 3));
    tickN(sim, 20);

    const deployments = sim.getDeployments("default");
    expect(deployments[0].spec.template.spec.containers[0].image).toBe("nginx:1.25");

    const rsets = sim.getState().replicaSets;
    expect(rsets.length).toBeGreaterThanOrEqual(2);

    const activePods = sim.getPods({ namespace: "default" }).filter(
      (p) => p.status.phase === "Running"
    );
    const newImagePods = activePods.filter((p) =>
      p.spec.containers.some((c) => c.image === "nginx:1.25")
    );
    expect(newImagePods.length).toBe(3);
  });
});

describe("ClusterSimulator — Service selector matching", () => {
  let sim: ClusterSimulator;

  beforeEach(() => {
    sim = new ClusterSimulator();
  });

  it("getServiceEndpoints returns 0 with wrong selector", () => {
    sim.apply(DEPLOYMENT_YAML("nginx:1.25", 2));
    tickN(sim, 15);
    sim.apply(SERVICE_YAML("wrong-label"));
    tickN(sim, 2);

    const endpoints = sim.getServiceEndpoints("backend-svc", "default");
    expect(endpoints).toHaveLength(0);
  });

  it("getServiceEndpoints returns running pods with correct selector", () => {
    // Apply a deployment with app=frontend label, then a service matching app=frontend
    const deployYaml = DEPLOYMENT_YAML("nginx:1.25", 2);
    sim.apply(deployYaml);
    tickN(sim, 15);

    const svcYaml = SERVICE_YAML("frontend");
    sim.apply(svcYaml);
    tickN(sim, 2);

    const endpoints = sim.getServiceEndpoints("backend-svc", "default");
    expect(endpoints.length).toBe(2);
    expect(endpoints.every((p) => p.status.phase === "Running")).toBe(true);
  });
});
