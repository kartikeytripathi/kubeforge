#!/usr/bin/env node
// Module 2 — etcd & the Storage Layer
// Generates slides.pptx using pptxgenjs
// Run: node build-slides.js
// Output: slides.pptx
//
// Install dependency (one-time):
//   npm install pptxgenjs

const PptxGenJS = require("pptxgenjs");

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:       "0A0A0A",  // near-black background
  accent:   "06B6D4",  // cyan
  white:    "F8F8F8",
  dim:      "6B7280",
  surface:  "1A1A2E",
  border:   "2D2D3A",
  teal:     "0D9488",
  amber:    "F59E0B",
  red:      "EF4444",
  green:    "10B981",
};

const FONT = "Courier New";
const FONT_BODY = "Helvetica Neue";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 inches
pptx.author = "KubeForge — Kubernetes Internals Mastery";
pptx.subject = "Module 2: etcd & the Storage Layer";

// ── Helpers ────────────────────────────────────────────────────────────────────

function slide(title, buildFn) {
  const s = pptx.addSlide();

  // Background
  s.background = { color: C.bg };

  // Top accent bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.06,
    fill: { color: C.accent },
    line: { type: "none" },
  });

  // Module badge (top-left)
  s.addText("MODULE 02 · etcd & Storage", {
    x: 0.4, y: 0.15, w: 4, h: 0.25,
    fontSize: 8, bold: true, color: C.accent,
    fontFace: FONT, charSpacing: 2,
  });

  // Slide title
  if (title) {
    s.addText(title, {
      x: 0.4, y: 0.5, w: 12.5, h: 0.7,
      fontSize: 28, bold: true, color: C.white,
      fontFace: FONT_BODY,
    });

    // Title underline
    s.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 1.22, w: 1.2, h: 0.04,
      fill: { color: C.accent },
      line: { type: "none" },
    });
  }

  buildFn(s);
  return s;
}

function codeBlock(s, code, opts = {}) {
  const { x = 0.4, y = 1.5, w = 12.5, h = 4.5, fontSize = 11 } = opts;
  s.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { color: C.surface },
    line: { color: C.border, pt: 1 },
  });
  s.addText(code, {
    x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2,
    fontSize, color: C.white, fontFace: FONT,
    valign: "top", wrap: true,
  });
}

function bullet(s, items, opts = {}) {
  const { x = 0.5, y = 1.5, w = 12.3, fontSize = 16 } = opts;
  const rows = items.map((item) => ({
    text: typeof item === "string" ? item : item.text,
    options: {
      bullet: { type: "bullet", code: "25B6" },
      fontSize,
      color: typeof item === "object" && item.dim ? C.dim : C.white,
      fontFace: FONT_BODY,
      paraSpaceAfter: 6,
      indentLevel: typeof item === "object" && item.indent ? 1 : 0,
    },
  }));
  s.addText(rows, { x, y, w, h: 5 });
}

function table(s, headers, rows, opts = {}) {
  const { x = 0.4, y = 1.5, w = 12.5 } = opts;
  const data = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: C.accent, fill: C.surface, align: "left" },
    })),
    ...rows.map((row) =>
      row.map((cell) => ({
        text: cell,
        options: { color: C.white, fill: C.bg, align: "left" },
      }))
    ),
  ];
  s.addTable(data, {
    x, y, w,
    fontSize: 13, fontFace: FONT_BODY,
    border: { type: "solid", color: C.border, pt: 1 },
    colW: Array(headers.length).fill(w / headers.length),
  });
}

function footnote(s, text) {
  s.addText(text, {
    x: 0.4, y: 7.1, w: 12.5, h: 0.25,
    fontSize: 9, color: C.dim, fontFace: FONT_BODY, italic: true,
  });
}

// ── Slides ─────────────────────────────────────────────────────────────────────

// 1. Title slide
slide(null, (s) => {
  s.addText("etcd & the Storage Layer", {
    x: 1, y: 2.2, w: 11, h: 1.2,
    fontSize: 48, bold: true, color: C.white,
    fontFace: FONT_BODY, align: "center",
  });
  s.addText("Kubernetes Internals Mastery · Module 02", {
    x: 1, y: 3.5, w: 11, h: 0.4,
    fontSize: 16, color: C.accent,
    fontFace: FONT_BODY, align: "center", charSpacing: 1,
  });
  s.addText("Where Kubernetes state actually lives", {
    x: 1, y: 4.1, w: 11, h: 0.4,
    fontSize: 14, color: C.dim,
    fontFace: FONT_BODY, align: "center",
  });

  // Cyan line decoration
  s.addShape(pptx.ShapeType.rect, {
    x: 5.4, y: 3.9, w: 2.5, h: 0.04,
    fill: { color: C.accent }, line: { type: "none" },
  });
});

// 2. The fundamental truth
slide("The one sentence that matters", (s) => {
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 11.7, h: 1.4,
    fill: { color: C.surface },
    line: { color: C.accent, pt: 2 },
  });
  s.addText("The API server is stateless.\netcd is the state.", {
    x: 1, y: 1.75, w: 11.3, h: 1.1,
    fontSize: 30, bold: true, color: C.white,
    fontFace: FONT_BODY, align: "center",
  });

  bullet(s, [
    "Every Pod, Deployment, Secret, ConfigMap → stored in etcd as protobuf",
    "Scheduler, controllers, API server: all stateless — restart-safe",
    "Lose etcd without a backup → lose the entire cluster state",
    "etcd = distributed KV store built on Raft consensus",
  ], { y: 3.2, fontSize: 15 });
});

// 3. Key structure
slide("How objects are keyed in etcd", (s) => {
  codeBlock(s, `/registry/<group>/<resource>/<namespace>/<name>

Examples:
  /registry/pods/default/nginx-6d4f8c9b-x2z9p
  /registry/deployments/kube-system/coredns
  /registry/secrets/production/db-credentials

  # Cluster-scoped (no namespace segment):
  /registry/nodes/ip-10-0-1-42.ec2.internal
  /registry/namespaces/production
  /registry/apiextensions.k8s.io/customresourcedefinitions/widgets.example.com`, { y: 1.4, h: 4 });

  footnote(s, "Source: staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go — KeyFunc");
});

// 4. Protobuf encoding
slide("Values are protobuf, not JSON", (s) => {
  bullet(s, [
    "Each value is a binary-encoded protobuf blob — not human-readable JSON",
    `Magic prefix: 4 bytes k8s\\x00 identify Kubernetes-encoded data`,
    "Wraps: runtime.Unknown envelope → TypeMeta → actual object protobuf",
    "Why? Protobuf is 3–10× smaller and faster to deserialise than JSON",
    { text: "kubectl responses are JSON — the API server converts on the way out", indent: true, dim: true },
  ], { y: 1.5, fontSize: 15 });

  codeBlock(s, `# Raw etcd value (binary — first bytes decoded):
$ etcdctl get /registry/pods/default/nginx | xxd | head -3
00000000: 6b38 7300 0a0d 0a02 7631 1207 76 31 62   k8s.....v1..v1b

# API server decoded view:
$ kubectl get pod nginx -o json | jq .metadata.resourceVersion
"482931"`, { y: 4.0, h: 2.5, fontSize: 10 });

  footnote(s, "Source: staging/src/k8s.io/apiserver/pkg/storage/etcd3/store.go — transformer.TransformToStorage");
});

// 5. ResourceVersion
slide("ResourceVersion = global revision counter", (s) => {
  bullet(s, [
    "Every write to any key increments a single cluster-wide revision integer",
    "resourceVersion in Kubernetes metadata IS the etcd mod_revision",
    "Not a per-object version — a global monotonic counter",
  ], { y: 1.5, fontSize: 15 });

  codeBlock(s, `# Kubernetes object
metadata:
  resourceVersion: "482931"   ← this is the etcd global revision

# etcd directly
$ etcdctl get /registry/pods/default/nginx --write-out=json \\
  | jq .kvs[0].mod_revision
482931                          ← same number

Used for:
  1. Optimistic concurrency — PUT rejected if revision changed since read
  2. Watch start points — ?watch&resourceVersion=482931 replays from there`, { y: 2.8, h: 3.8, fontSize: 11 });
});

// 6. Watch pipeline
slide("The Watch / Notify pipeline", (s) => {
  const boxes = [
    { x: 0.4,  y: 1.5,  w: 2.8, label: "etcd\ngRPC stream",    color: C.accent },
    { x: 3.5,  y: 1.5,  w: 2.8, label: "API server\nwatchCache", color: C.teal  },
    { x: 6.6,  y: 1.5,  w: 2.8, label: "watchServer\n(filter)",  color: C.teal  },
    { x: 9.7,  y: 1.5,  w: 2.8, label: "Informer →\nReconciler", color: C.dim   },
  ];

  boxes.forEach(({ x, y, w, label, color }) => {
    s.addShape(pptx.ShapeType.rect, {
      x, y, w, h: 1.1,
      fill: { color: C.surface },
      line: { color, pt: 2 },
    });
    s.addText(label, {
      x: x + 0.1, y: y + 0.1, w: w - 0.2, h: 0.9,
      fontSize: 13, bold: true, color: C.white,
      fontFace: FONT_BODY, align: "center", valign: "middle",
    });
  });

  // Arrows
  [3.2, 6.3, 9.4].forEach((x) => {
    s.addText("→", {
      x, y: 1.85, w: 0.4, h: 0.4,
      fontSize: 18, color: C.accent, align: "center",
    });
  });

  bullet(s, [
    "watchCache: in-memory ring buffer of recent events (100–1000 per resource)",
    "Serves most watch requests WITHOUT touching etcd — shields etcd from fan-out",
    "If resourceVersion too old (compacted): watcher gets 410 Gone → must re-list",
    "BOOKMARK events: heartbeat carrying latest revision during quiet periods",
  ], { y: 3.0, fontSize: 14 });

  footnote(s, "Source: staging/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go — Cacher");
});

// 7. Watch event types
slide("etcd → Kubernetes event mapping", (s) => {
  table(s,
    ["etcd event", "Kubernetes watch event", "When"],
    [
      ["PUT (new key)",              "ADDED",    "Object created for the first time"],
      ["PUT (existing key, new rev)","MODIFIED", "Object updated (any field change)"],
      ["DELETE",                     "DELETED",  "Object deleted"],
      ["— (synthetic)",              "BOOKMARK", "Heartbeat — no object change, advances RV"],
    ],
    { y: 1.5 }
  );

  bullet(s, [
    "BOOKMARK allows clients to advance resourceVersion during quiet periods",
    "Prevents controllers from re-listing after reconnect just because nothing happened",
  ], { y: 5.0, fontSize: 14 });
});

// 8. MVCC
slide("MVCC — Multi-Version Concurrency Control", (s) => {
  bullet(s, [
    "Every write creates a NEW revision of a key — old revisions retained",
    "Enables point-in-time reads: etcdctl get <key> --rev=<n>",
    "Without compaction → etcd grows without bound (every pod restart = new revision)",
  ], { y: 1.5, fontSize: 15 });

  codeBlock(s, `# Read current value
$ etcdctl get /registry/configmaps/default/myconfig

# Read value at an older revision
$ etcdctl get /registry/configmaps/default/myconfig --rev=48000

# Check total DB size (watch for bloat)
$ etcdctl endpoint status --write-out=table
+-------------+------------------+-----------+------------+-----------+
|  ENDPOINT   |        ID        |  VERSION  |  DB SIZE   |  IS LEADER|
+-------------+------------------+-----------+------------+-----------+
| 127.0.0.1   | abc123def456789  |   3.5.12  |   42 MB    |   true    |
+-------------+------------------+-----------+------------+-----------+`, { y: 2.8, h: 3.3, fontSize: 10 });
});

// 9. Compaction
slide("Compaction — keep etcd healthy", (s) => {
  bullet(s, [
    "Compaction discards revisions below a given point",
    "API server auto-compacts every 5 min (--etcd-compaction-interval)",
    "After compaction: reads for old revisions return error",
    { text: "This is the #1 cause of 410 Gone / controller re-list storms", dim: false },
  ], { y: 1.5, fontSize: 15 });

  codeBlock(s, `# Manual compaction to current revision
$ CURRENT_REV=$(etcdctl endpoint status --write-out=json \\
    | jq '.[0].Status.header.revision')
$ etcdctl compact $CURRENT_REV

# Try reading before the compaction point → error:
$ etcdctl get /registry/pods/default/old-pod --rev=$((CURRENT_REV - 1000))
Error: etcdserver: mvcc: required revision has been compacted

# Defragment to reclaim disk space (holds exclusive lock — do one node at a time)
$ etcdctl defrag`, { y: 3.0, h: 3.5, fontSize: 11 });
});

// 10. Snapshot & Restore
slide("Snapshot & Restore", (s) => {
  codeBlock(s, `# Take a snapshot
$ etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db

# Verify
$ etcdctl snapshot status /backup/etcd-20260101.db --write-out=table
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| a3f1b2c4 |  1048576 |       4231 |     6.2 MB |
+----------+----------+------------+------------+

# Restore (stop control-plane first, do on EVERY node from SAME snapshot)
$ etcdctl snapshot restore /backup/etcd-20260101.db \\
  --name etcd-1 \\
  --initial-cluster etcd-1=https://10.0.1.10:2380 \\
  --initial-cluster-token etcd-cluster-1 \\
  --initial-advertise-peer-urls https://10.0.1.10:2380 \\
  --data-dir /var/lib/etcd-restored`, { y: 1.4, h: 5.2 });

  footnote(s, "Critical: all nodes must restore from the SAME snapshot — different snapshots = split-brain");
});

// 11. Quorum loss
slide("What happens when etcd loses quorum", (s) => {
  bullet(s, [
    "etcd requires (n/2)+1 nodes — 3-node cluster tolerates 1 failure",
    "Writes to API server → 503 or timeout",
    "Reads may temporarily succeed (stale cache)",
    "Running Pods keep running — kubelet is decoupled from etcd",
    "Scheduler/controllers cannot write new state → no new Pods",
    "Service discovery degrades — kube-proxy can't get Endpoint updates",
  ], { y: 1.5, fontSize: 14 });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 5.0, w: 12.5, h: 1.2,
    fill: { color: C.surface },
    line: { color: C.red, pt: 1 },
  });
  s.addText("Last resort — force new cluster (discards other members permanently):\n$ etcd --force-new-cluster --data-dir=/var/lib/etcd", {
    x: 0.6, y: 5.1, w: 12.1, h: 1.0,
    fontSize: 11, color: C.white, fontFace: FONT,
  });
});

// 12. EKS implications
slide("EKS — no etcdctl, different debugging model", (s) => {
  table(s,
    ["Concern", "Self-managed", "EKS"],
    [
      ["etcd backup",    "etcdctl snapshot save (manual/cron)", "AWS auto-backup (not customer-accessible)"],
      ["etcd access",    "Direct etcdctl access",               "No access — AWS-owned infrastructure"],
      ["Quorum failure", "You recover",                         "AWS recovers (covered by EKS SLA)"],
      ["Debugging",      "etcdctl get, endpoint status",        "API server audit logs in CloudWatch"],
      ["DB size metric", "etcd_db_total_size_in_bytes",         "Watch apiserver_storage_objects instead"],
    ],
    { y: 1.4 }
  );

  bullet(s, [
    "Proxy metric: apiserver_storage_objects{resource=...} — count per resource type",
    "Pressure shows as: apiserver_request_duration_seconds p99 spikes on LIST calls",
  ], { y: 5.5, fontSize: 13 });
});

// 13. Failure modes
slide("Common failure modes", (s) => {
  table(s,
    ["Symptom", "Root cause", "Fix"],
    [
      ["database space exceeded",     "DB > quota (default 2 GB)",          "compact + defrag"],
      ["Controllers re-list constantly","Watch RV compacted away",           "Lower compaction interval or raise watchCache"],
      ["Slow LIST on large resources","Too many objects of one type",        "etcdctl get --prefix --keys-only | wc -l"],
      ["context deadline exceeded",   "Leader election / disk I/O sat.",     "Check etcd_server_leader_changes_seen_total"],
      ["resourceVersion too old",     "Client reconnect with stale RV",     "Always List before resuming Watch"],
    ],
    { y: 1.4 }
  );
});

// 14. Lab preview
slide("Lab 2 — What you'll do", (s) => {
  bullet(s, [
    "Exercise 1 · Inspect raw keys — see protobuf blobs, match resourceVersion to mod_revision",
    "Exercise 2 · Watch the etcd stream — observe PUT/DELETE events in real time",
    "Exercise 3 · MVCC — read object state at past revisions",
    "Exercise 4 · Compaction — trigger a 410 Gone, then defrag to reclaim space",
    "Exercise 5 · Snapshot — save snapshot, restore to a new data directory",
    "Exercise 6 · Quorum loss — pause etcd, observe API server behaviour",
  ], { y: 1.5, fontSize: 15 });

  s.addText("Setup: bash lab.sh && source /tmp/etcd-lab-env.sh", {
    x: 0.4, y: 6.2, w: 12.5, h: 0.4,
    fontSize: 12, color: C.accent, fontFace: FONT,
  });
});

// 15. Key takeaways
slide("Key takeaways", (s) => {
  bullet(s, [
    "etcd is the ONLY persistent component — API server, scheduler, controllers are stateless",
    "Protobuf + MVCC = performance. resourceVersion = global revision, not per-object",
    "watchCache shields etcd from fan-out — most controllers never touch etcd directly",
    "Compaction is essential but is the #1 cause of 410 Gone / re-list storms",
    "On EKS: no etcdctl access — learn API server metrics and audit logs instead",
  ], { y: 1.5, fontSize: 17 });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 5.8, w: 12.5, h: 1.0,
    fill: { color: C.surface },
    line: { color: C.accent, pt: 1 },
  });
  s.addText("Next: Module 03 — Controllers & Reconciliation", {
    x: 0.6, y: 5.9, w: 12.1, h: 0.8,
    fontSize: 16, bold: true, color: C.accent,
    fontFace: FONT_BODY, align: "center", valign: "middle",
  });
});

// ── Write output ───────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: "slides.pptx" })
  .then(() => console.log("✓ slides.pptx written"))
  .catch((err) => { console.error(err); process.exit(1); });
