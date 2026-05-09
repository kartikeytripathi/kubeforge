import type { ClusterSimulator } from "./simulator";

export interface KubectlResult {
  output: string;
  error?: boolean;
}

function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length))
  );
  const header = headers.map((h, i) => h.padEnd(widths[i])).join("   ");
  const lines = rows.map((r) => r.map((c, i) => c.padEnd(widths[i])).join("   "));
  return [header, ...lines].join("\n");
}

function parseFlags(args: string[]): { flags: Record<string, string | true>; positional: string[] } {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const [k, v] = args[i].slice(2).split("=");
      flags[k] = v !== undefined ? v : args[i + 1]?.startsWith("-") === false ? (args[++i] ?? true) : true;
    } else if (args[i].startsWith("-") && args[i].length === 2) {
      flags[args[i].slice(1)] = args[i + 1]?.startsWith("-") === false ? (args[++i] ?? true) : true;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

function nsFromFlags(flags: Record<string, string | true>): string | undefined {
  const v = flags["namespace"] ?? flags["n"];
  return typeof v === "string" ? v : undefined;
}

export function executeKubectl(sim: ClusterSimulator, input: string): KubectlResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: "" };

  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const cmd = tokens[0];

  if (cmd !== "kubectl") {
    return { output: `command not found: ${cmd}`, error: true };
  }

  const sub = tokens[1];
  const rest = tokens.slice(2);
  const { flags, positional } = parseFlags(rest);
  const ns = nsFromFlags(flags) ?? "default";
  const allNs = flags["all-namespaces"] === true || flags["A"] === true;

  switch (sub) {
    case "get": {
      const resource = positional[0]?.toLowerCase();
      const nameFilter = positional[1];

      if (!resource) return { output: "error: must specify the type of resource to get", error: true };

      if (resource === "pods" || resource === "pod" || resource === "po") {
        const pods = allNs
          ? sim.getPods()
          : sim.getPods({ namespace: ns });
        const filtered = nameFilter ? pods.filter((p) => p.metadata.name === nameFilter) : pods;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };

        const headers = allNs
          ? ["NAMESPACE", "NAME", "READY", "STATUS", "RESTARTS", "AGE"]
          : ["NAME", "READY", "STATUS", "RESTARTS", "AGE"];

        const rows = filtered.map((p) => {
          const ready = `${p.status.containerStatuses.filter((c) => c.ready).length}/${p.status.containerStatuses.length}`;
          const status = p.status.containerStatuses.some((c) => c.state.reason === "CrashLoopBackOff")
            ? "CrashLoopBackOff"
            : p.status.phase;
          const restarts = p.status.containerStatuses.reduce((s, c) => s + c.restartCount, 0).toString();
          const age = `${Math.max(0, Math.floor((Date.now() - p.metadata.creationTimestamp) / 1000))}s`;
          return allNs
            ? [p.metadata.namespace, p.metadata.name, ready, status, restarts, age]
            : [p.metadata.name, ready, status, restarts, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "deployments" || resource === "deployment" || resource === "deploy") {
        const deploys = allNs ? sim.getDeployments() : sim.getDeployments(ns);
        const filtered = nameFilter ? deploys.filter((d) => d.metadata.name === nameFilter) : deploys;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = allNs
          ? ["NAMESPACE", "NAME", "READY", "UP-TO-DATE", "AVAILABLE", "AGE"]
          : ["NAME", "READY", "UP-TO-DATE", "AVAILABLE", "AGE"];
        const rows = filtered.map((d) => {
          const ready = `${d.status.readyReplicas}/${d.spec.replicas}`;
          const age = `${Math.floor((Date.now() - d.metadata.creationTimestamp) / 1000)}s`;
          return allNs
            ? [d.metadata.namespace, d.metadata.name, ready, d.status.updatedReplicas.toString(), d.status.availableReplicas.toString(), age]
            : [d.metadata.name, ready, d.status.updatedReplicas.toString(), d.status.availableReplicas.toString(), age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "services" || resource === "service" || resource === "svc") {
        const svcs = allNs ? sim.getServices() : sim.getServices(ns);
        const filtered = nameFilter ? svcs.filter((s) => s.metadata.name === nameFilter) : svcs;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = allNs
          ? ["NAMESPACE", "NAME", "TYPE", "CLUSTER-IP", "PORT(S)", "AGE"]
          : ["NAME", "TYPE", "CLUSTER-IP", "PORT(S)", "AGE"];
        const rows = filtered.map((s) => {
          const ports = s.spec.ports.map((p) => `${p.port}/${p.protocol ?? "TCP"}`).join(",");
          const age = `${Math.floor((Date.now() - s.metadata.creationTimestamp) / 1000)}s`;
          return allNs
            ? [s.metadata.namespace, s.metadata.name, s.spec.type, s.spec.clusterIP ?? "<none>", ports, age]
            : [s.metadata.name, s.spec.type, s.spec.clusterIP ?? "<none>", ports, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "nodes" || resource === "node" || resource === "no") {
        const nodes = sim.getNodes();
        const headers = ["NAME", "STATUS", "ROLES", "AGE", "VERSION"];
        const rows = nodes.map((n) => {
          const age = `${Math.floor((Date.now() - n.metadata.creationTimestamp) / 1000)}s`;
          return [n.metadata.name, n.status.phase, "worker", age, "v1.28.0"];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "namespaces" || resource === "namespace" || resource === "ns") {
        const namespaces = sim.getNamespaces();
        if (namespaces.length === 0) return { output: "No resources found." };
        const headers = ["NAME", "STATUS", "AGE"];
        const rows = namespaces.map((n) => {
          const age = `${Math.floor((Date.now() - n.metadata.creationTimestamp) / 1000)}s`;
          return [n.metadata.name, n.status.phase, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "configmaps" || resource === "configmap" || resource === "cm") {
        const cms = sim.getConfigMaps(allNs ? undefined : ns);
        const filtered = nameFilter ? cms.filter((c) => c.metadata.name === nameFilter) : cms;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = allNs ? ["NAMESPACE", "NAME", "DATA", "AGE"] : ["NAME", "DATA", "AGE"];
        const rows = filtered.map((c) => {
          const age = `${Math.floor((Date.now() - c.metadata.creationTimestamp) / 1000)}s`;
          const dataCount = Object.keys(c.data ?? {}).length.toString();
          return allNs ? [c.metadata.namespace, c.metadata.name, dataCount, age] : [c.metadata.name, dataCount, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "secrets" || resource === "secret") {
        const secrets = sim.getSecrets(allNs ? undefined : ns);
        const filtered = nameFilter ? secrets.filter((s) => s.metadata.name === nameFilter) : secrets;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = allNs ? ["NAMESPACE", "NAME", "TYPE", "DATA", "AGE"] : ["NAME", "TYPE", "DATA", "AGE"];
        const rows = filtered.map((s) => {
          const age = `${Math.floor((Date.now() - s.metadata.creationTimestamp) / 1000)}s`;
          const dataCount = Object.keys(s.data ?? {}).length.toString();
          return allNs
            ? [s.metadata.namespace, s.metadata.name, s.type ?? "Opaque", dataCount, age]
            : [s.metadata.name, s.type ?? "Opaque", dataCount, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "pvc" || resource === "persistentvolumeclaims" || resource === "persistentvolumeclaim") {
        const pvcs = sim.getPersistentVolumeClaims(allNs ? undefined : ns);
        const filtered = nameFilter ? pvcs.filter((p) => p.metadata.name === nameFilter) : pvcs;
        if (filtered.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = allNs ? ["NAMESPACE", "NAME", "STATUS", "VOLUME", "CAPACITY", "AGE"] : ["NAME", "STATUS", "VOLUME", "CAPACITY", "AGE"];
        const rows = filtered.map((p) => {
          const age = `${Math.floor((Date.now() - p.metadata.creationTimestamp) / 1000)}s`;
          return allNs
            ? [p.metadata.namespace, p.metadata.name, p.status.phase, p.spec.volumeName ?? "<unset>", p.status.capacity?.storage ?? p.spec.resources.requests.storage, age]
            : [p.metadata.name, p.status.phase, p.spec.volumeName ?? "<unset>", p.status.capacity?.storage ?? p.spec.resources.requests.storage, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "pv" || resource === "persistentvolumes" || resource === "persistentvolume") {
        const pvs = sim.getPersistentVolumes();
        const filtered = nameFilter ? pvs.filter((p) => p.metadata.name === nameFilter) : pvs;
        if (filtered.length === 0) return { output: "No resources found." };
        const headers = ["NAME", "CAPACITY", "ACCESS MODES", "RECLAIM POLICY", "STATUS", "AGE"];
        const rows = filtered.map((p) => {
          const age = `${Math.floor((Date.now() - p.metadata.creationTimestamp) / 1000)}s`;
          return [p.metadata.name, p.spec.capacity.storage, p.spec.accessModes.join(","), p.spec.persistentVolumeReclaimPolicy ?? "Retain", p.status.phase, age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "storageclasses" || resource === "storageclass" || resource === "sc") {
        const scs = sim.getStorageClasses();
        if (scs.length === 0) return { output: "No resources found." };
        const headers = ["NAME", "PROVISIONER", "RECLAIMPOLICY", "VOLUMEBINDINGMODE", "AGE"];
        const rows = scs.map((s) => {
          const age = `${Math.floor((Date.now() - s.metadata.creationTimestamp) / 1000)}s`;
          return [s.metadata.name, s.provisioner, s.reclaimPolicy ?? "Delete", s.volumeBindingMode ?? "Immediate", age];
        });
        return { output: formatTable(headers, rows) };
      }

      if (resource === "events" || resource === "event") {
        const events = sim.getEvents();
        const nsEvents = allNs ? events : events.filter((e) => !e.involvedObject.namespace || e.involvedObject.namespace === ns);
        if (nsEvents.length === 0) return { output: `No resources found${allNs ? "" : ` in ${ns} namespace`}.` };
        const headers = ["LAST SEEN", "TYPE", "REASON", "OBJECT", "MESSAGE"];
        const rows = nsEvents.slice(0, 20).map((e) => {
          const age = `${Math.floor((Date.now() - e.timestamp) / 1000)}s`;
          return [age, e.type, e.reason, `${e.involvedObject.kind}/${e.involvedObject.name}`, e.message.slice(0, 50)];
        });
        return { output: formatTable(headers, rows) };
      }

      return { output: `error: the server doesn't have a resource type "${resource}"`, error: true };
    }

    case "describe": {
      const resource = positional[0]?.toLowerCase();
      const name = positional[1];

      if (!resource || !name) {
        return { output: "error: must specify the type and name of resource to describe", error: true };
      }

      if (resource === "pod" || resource === "pods" || resource === "po") {
        const pod = sim.getPods({ namespace: ns }).find((p) => p.metadata.name === name);
        if (!pod) return { output: `Error from server (NotFound): pods "${name}" not found`, error: true };

        const lines = [
          `Name:         ${pod.metadata.name}`,
          `Namespace:    ${pod.metadata.namespace}`,
          `Node:         ${pod.spec.nodeName ?? "<none>"}`,
          `Labels:       ${Object.entries(pod.metadata.labels).map(([k, v]) => `${k}=${v}`).join(", ") || "<none>"}`,
          `Status:       ${pod.status.phase}`,
          `IP:           ${pod.status.podIP ?? "<none>"}`,
          ``,
          `Containers:`,
          ...pod.spec.containers.flatMap((c) => {
            const cs = pod.status.containerStatuses.find((s) => s.name === c.name);
            return [
              `  ${c.name}:`,
              `    Image:    ${c.image}`,
              `    State:    ${cs?.state.type ?? "waiting"}${cs?.state.reason ? ` (${cs.state.reason})` : ""}`,
              `    Ready:    ${cs?.ready ? "True" : "False"}`,
              `    Restarts: ${cs?.restartCount ?? 0}`,
            ];
          }),
          ``,
          `Events:`,
          ...sim.getEvents()
            .filter((e) => e.involvedObject.name === name && e.involvedObject.namespace === ns)
            .slice(0, 5)
            .map((e) => `  ${e.type}  ${e.reason}  ${e.message}`),
        ];
        return { output: lines.join("\n") };
      }

      if (resource === "pvc" || resource === "persistentvolumeclaim") {
        const pvc = sim.getPersistentVolumeClaims(ns).find((p) => p.metadata.name === name);
        if (!pvc) return { output: `Error from server (NotFound): persistentvolumeclaims "${name}" not found`, error: true };
        const lines = [
          `Name:          ${pvc.metadata.name}`,
          `Namespace:     ${pvc.metadata.namespace}`,
          `Status:        ${pvc.status.phase}`,
          `Volume:        ${pvc.spec.volumeName ?? "<unset>"}`,
          `Capacity:      ${pvc.status.capacity?.storage ?? pvc.spec.resources.requests.storage}`,
          `Access Modes:  ${pvc.spec.accessModes.join(", ")}`,
          `StorageClass:  ${pvc.spec.storageClassName ?? "<none>"}`,
        ];
        return { output: lines.join("\n") };
      }

      return { output: `error: the server doesn't have a resource type "${resource}"`, error: true };
    }

    case "scale": {
      const resourceArg = positional[0];
      const replicasFlag = flags["replicas"];
      if (!resourceArg || !replicasFlag) {
        return { output: "error: required flags: --replicas", error: true };
      }
      const [, name] = resourceArg.includes("/") ? resourceArg.split("/") : ["", resourceArg];
      const replicas = parseInt(typeof replicasFlag === "string" ? replicasFlag : "0", 10);
      const deploys = sim.getDeployments(ns);
      const deploy = deploys.find((d) => d.metadata.name === name);
      if (!deploy) return { output: `Error from server (NotFound): deployments.apps "${name}" not found`, error: true };
      sim.apply(
        `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${deploy.metadata.name}\n  namespace: ${deploy.metadata.namespace}\nspec:\n  replicas: ${replicas}\n  selector:\n    matchLabels: ${JSON.stringify(deploy.spec.selector.matchLabels)}\n  template: ${JSON.stringify(deploy.spec.template)}\n`
      );
      return { output: `deployment.apps/${name} scaled` };
    }

    case "delete": {
      return { output: "note: delete is read-only in this simulator — use the YAML editor to remove resources." };
    }

    case "apply": {
      return { output: "note: use the YAML editor on the left to apply manifests in this simulator." };
    }

    case "logs": {
      const podName = positional[0];
      if (!podName) return { output: "error: must specify a pod name", error: true };
      const pod = sim.getPods({ namespace: ns }).find((p) => p.metadata.name === podName);
      if (!pod) return { output: `Error from server (NotFound): pods "${podName}" not found`, error: true };
      const cs = pod.status.containerStatuses[0];
      if (cs?.state.reason === "CrashLoopBackOff") {
        return { output: `Error: container "${cs.name}" is in CrashLoopBackOff state.\nback-off restarting failed container\n` };
      }
      return { output: `[simulated] Container ${cs?.name ?? "unknown"} is ${cs?.state.type ?? "waiting"}.\nNo real log output available in the simulator.\n` };
    }

    case "exec": {
      return { output: "error: exec is not supported in the simulator.", error: true };
    }

    case "version": {
      return { output: "Client Version: v1.28.0\nServer Version: v1.28.0" };
    }

    case "cluster-info": {
      return {
        output: `Kubernetes control plane is running at https://sim.kubeforge.local:6443\nCoreDNS is running at https://sim.kubeforge.local:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy`,
      };
    }

    case "help":
    case undefined:
      return {
        output: [
          "kubectl controls the Kubernetes cluster manager.",
          "",
          "Basic Commands:",
          "  get         Display one or many resources",
          "  describe    Show details of a specific resource",
          "  scale       Set a new size for a deployment",
          "  logs        Print the logs for a container in a pod",
          "  delete      (read-only in simulator)",
          "  apply       (use YAML editor instead)",
          "",
          "Available resource types: pods, deployments, services, nodes,",
          "  namespaces, configmaps, secrets, pvc, pv, storageclasses, events",
          "",
          "Flags:",
          "  -n, --namespace    Specify the namespace (default: default)",
          "  -A, --all-namespaces  List resources across all namespaces",
        ].join("\n"),
      };

    default:
      return {
        output: `error: unknown command "${sub}". Run 'kubectl help' for usage.`,
        error: true,
      };
  }
}
