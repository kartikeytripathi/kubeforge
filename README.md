# KubeForge

A webapp for learning Kubernetes and Amazon EKS through hands-on labs. Every concept ships with a lab; every lab has automated verification.

**Target learner:** Experienced AWS engineer pursuing CKA, moving into a DevOps role.

**Live:** [kubeforge.vercel.app](https://kubeforge.vercel.app) — jump straight to [lesson/a1](https://kubeforge.vercel.app/lesson/a1)

---

## Labs

38 labs across 4 phases, all available on the [curriculum page](https://kubeforge.vercel.app/curriculum).

| Phase | Title | Labs |
|---|---|---|
| **A** | Foundations (Vanilla K8s) | A1–A8 (8 labs) |
| **B** | Production K8s | B1–B10 (10 labs) |
| **C** | Advanced K8s | C1–C9 (9 labs) |
| **D** | EKS Deep Track | D1–D13 (13 labs) |

### Phase A — Foundations

| ID | Title | Incident |
|---|---|---|
| A1 | Fix the CrashLoopBackOff | 🔥 |
| A2 | Zero-downtime image rollout | |
| A3 | Wire the frontend to the backend | |
| A4 | ConfigMaps and Secrets | |
| A5 | Volumes, PV, PVC, StorageClasses | |
| A6 | Namespace isolation | |
| A7 | Multi-resource stack deploy | |
| A8 | Boss Lab — Production incident | 🔥 |

### Phase B — Production K8s

| ID | Title | Incident |
|---|---|---|
| B1 | Fix failing liveness probe | 🔥 |
| B2 | Resource requests and limits | |
| B3 | Taints and tolerations | |
| B4 | StatefulSets and stable identity | |
| B5 | DaemonSets | |
| B6 | Jobs and CronJobs | |
| B7 | Ingress routing | |
| B8 | RBAC — ServiceAccounts, Roles, RoleBindings | |
| B9 | HorizontalPodAutoscaler | |
| B10 | Boss Lab — Three production failures | 🔥 |

### Phase C — Advanced K8s

| ID | Title | Incident |
|---|---|---|
| C1 | CRDs and the operator pattern | |
| C2 | Admission webhooks | |
| C3 | Scheduler internals | |
| C4 | Controller reconciliation | |
| C5 | Service mesh basics (Istio mTLS) | |
| C6 | GitOps with ArgoCD | |
| C7 | Pod Security Standards / Kyverno | |
| C8 | Backup and DR with Velero | |
| C9 | Boss Lab — ArgoCD repo-server bottleneck | 🔥 |

### Phase D — EKS Deep Track

| ID | Title | Incident |
|---|---|---|
| D1 | EKS architecture — control plane and data plane | |
| D2 | VPC CNI prefix delegation | |
| D3 | IRSA and Pod Identity | |
| D4 | AWS Load Balancer Controller | |
| D5 | Karpenter consolidation | 🔥 |
| D6 | EKS Auto Mode | |
| D7 | EKS add-ons and version upgrades | |
| D8 | Cross-account ECR | 🔥 |
| D9 | ECR lifecycle policies | 🔥 |
| D10 | EKS observability — kubelet volume metrics | |
| D11 | EKS Fargate specifics | 🔥 |
| D12 | Cost optimization — Spot + Karpenter | |
| D13 | Capstone — ShopEKS revival | 🔥 |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript 5 |
| Styling | Tailwind CSS v4 + custom dark theme |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Cluster diagrams | React Flow (`reactflow`) |
| YAML parsing | `js-yaml` |
| Lesson content | MDX rendered via `marked` |
| State / progress | Zustand with `localStorage` persist |
| Database | SQLite via Prisma 7 (ephemeral on Vercel — progress lives in localStorage) |
| Testing | Vitest (unit) + Playwright (e2e) |
| Package manager | pnpm |

---

## Repo Layout

```
kubeforge/
├── app/
│   ├── lesson/[id]/          # Lab pages (server-rendered, force-dynamic)
│   ├── curriculum/           # Phase/lesson browser
│   ├── progress/             # Heatmap + readiness gauges
│   └── settings/             # Keyboard shortcuts, cluster options
├── components/
│   ├── LabPane.tsx           # Three-panel lab layout
│   ├── YamlEditor.tsx        # Monaco editor (YAML mode)
│   ├── ClusterCanvas.tsx     # React Flow cluster visualisation
│   ├── VerifyPanel.tsx       # Objectives checklist + hints
│   └── AppShell.tsx          # Top nav + sidebar wrapper
├── lib/
│   ├── simulator/            # In-memory K8s cluster state machine
│   │   ├── index.ts          # ClusterSimulator class + apply/tick/query API
│   │   ├── reconciler.ts     # Deployment→RS→Pod, scheduling, crash detection
│   │   ├── types.ts          # K8s object types (Pod, Deployment, Service…)
│   │   └── utils.ts          # Label matching, uid helpers
│   ├── verifiers/            # Per-lab assertion functions (one file per lab)
│   └── progress-store.ts     # Zustand progress store (localStorage)
├── content/
│   ├── lessons/              # MDX concept text (one per lab, ≤400 words)
│   └── labs/                 # JSON lab definitions (starter YAML, objectives, hints, solution)
└── tests/
    ├── unit/                 # Vitest — simulator + verifier tests
    └── e2e/                  # Playwright — phase smoke tests
```

---

## Local Development

```bash
pnpm install
pnpm db:generate
pnpm db:migrate   # creates prisma/dev.db
pnpm dev
# → http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright e2e tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

---

## Non-Goals (v1)

- No login / multi-tenancy / SaaS scaffolding
- No in-app AI assistant (reveal-solution button only, after 3 failures)
- No telemetry or external API calls beyond K8s docs links
