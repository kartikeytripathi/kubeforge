"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ClusterState, SimPod } from "@/lib/simulator/types";

// ─── Status colours ────────────────────────────────────────────────────────────

function podColor(pod: SimPod): string {
  const crashing = pod.status.containerStatuses.some(
    (cs) => cs.state.reason === "CrashLoopBackOff"
  );
  if (crashing) return "#ef4444";       // red-500
  if (pod.status.phase === "Running") return "#22c55e";   // green-500
  if (pod.status.phase === "Pending") return "#eab308";   // yellow-500
  if (pod.status.phase === "Failed") return "#ef4444";
  return "#6b7280"; // gray
}

function podStatusLabel(pod: SimPod): string {
  const crashing = pod.status.containerStatuses.some(
    (cs) => cs.state.reason === "CrashLoopBackOff"
  );
  if (crashing) return "CrashLoop";
  return pod.status.phase;
}

// ─── Build RF nodes & edges from ClusterState ─────────────────────────────────

function buildGraph(state: ClusterState): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const NODE_Y = 40;
  const POD_ROW_Y = 160;
  const SVC_ROW_Y = 320;
  const DEPLOY_ROW_Y = 480;

  // Nodes
  state.nodes.forEach((n, i) => {
    nodes.push({
      id: `node-${n.metadata.uid}`,
      type: "default",
      position: { x: 60 + i * 260, y: NODE_Y },
      data: { label: `⬡ ${n.metadata.name}\n${n.status.phase}` },
      style: {
        background: n.status.phase === "Ready" ? "#21262d" : "#451a03",
        border: `1px solid ${n.status.phase === "Ready" ? "#0d9488" : "#ef4444"}`,
        color: "#e6edf3",
        borderRadius: 8,
        fontSize: 11,
        padding: "6px 10px",
        whiteSpace: "pre",
        minWidth: 140,
      },
    });
  });

  // Pods
  state.pods.forEach((pod, i) => {
    const color = podColor(pod);
    const status = podStatusLabel(pod);
    const nodeId = state.nodes.find((n) => n.metadata.name === pod.spec.nodeName);

    nodes.push({
      id: `pod-${pod.metadata.uid}`,
      type: "default",
      position: { x: 20 + (i % 6) * 175, y: POD_ROW_Y + Math.floor(i / 6) * 90 },
      data: {
        label: `● ${pod.metadata.name}\n${status}`,
      },
      style: {
        background: "#161b22",
        border: `2px solid ${color}`,
        color: "#e6edf3",
        borderRadius: 6,
        fontSize: 10,
        padding: "4px 8px",
        whiteSpace: "pre",
        minWidth: 130,
      },
    });

    if (nodeId) {
      edges.push({
        id: `edge-node-pod-${pod.metadata.uid}`,
        source: `node-${nodeId.metadata.uid}`,
        target: `pod-${pod.metadata.uid}`,
        animated: pod.status.phase === "Pending",
        style: { stroke: "#2d333b" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2d333b" },
      });
    }
  });

  // Services
  state.services.forEach((svc, i) => {
    nodes.push({
      id: `svc-${svc.metadata.uid}`,
      type: "default",
      position: { x: 20 + i * 220, y: SVC_ROW_Y },
      data: { label: `⎈ ${svc.metadata.name}\n${svc.spec.type}` },
      style: {
        background: "#0c1929",
        border: "1px solid #3b82f6",
        color: "#93c5fd",
        borderRadius: 6,
        fontSize: 10,
        padding: "4px 10px",
        whiteSpace: "pre",
        minWidth: 130,
      },
    });

    // Draw edges to selected pods
    if (svc.spec.selector) {
      state.pods.forEach((pod) => {
        const matches =
          pod.metadata.namespace === svc.metadata.namespace &&
          pod.status.phase === "Running" &&
          Object.entries(svc.spec.selector!).every(([k, v]) => pod.metadata.labels[k] === v);

        if (matches) {
          edges.push({
            id: `edge-svc-pod-${svc.metadata.uid}-${pod.metadata.uid}`,
            source: `svc-${svc.metadata.uid}`,
            target: `pod-${pod.metadata.uid}`,
            style: { stroke: "#3b82f6", strokeDasharray: "4 2" },
            animated: false,
          });
        }
      });
    }
  });

  // Deployments
  state.deployments.forEach((d, i) => {
    nodes.push({
      id: `deploy-${d.metadata.uid}`,
      type: "default",
      position: { x: 20 + i * 220, y: DEPLOY_ROW_Y },
      data: {
        label: `▦ ${d.metadata.name}\n${d.status.readyReplicas}/${d.spec.replicas} ready`,
      },
      style: {
        background: "#0d1a14",
        border: "1px solid #0d9488",
        color: "#5eead4",
        borderRadius: 6,
        fontSize: 10,
        padding: "4px 10px",
        whiteSpace: "pre",
        minWidth: 140,
      },
    });
  });

  return { nodes, edges };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  clusterState: ClusterState | null;
}

export function ClusterCanvas({ clusterState }: Props) {
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!clusterState) return;
    const { nodes, edges } = buildGraph(clusterState);
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [clusterState]);

  if (!clusterState) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Cluster loading…
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg border border-surface-600 bg-surface-900">
      <div className="h-full">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2d333b" gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

