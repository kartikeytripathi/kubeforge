# KubeForge

A self-hosted, single-user webapp for learning Kubernetes and Amazon EKS through hands-on labs. Every concept ships with a lab; every lab has automated verification.

**Target learner:** Experienced AWS engineer pursuing CKA, moving into a DevOps role.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up the database
pnpm db:generate
pnpm db:migrate   # creates prisma/dev.db — enter a migration name when prompted

# Run the dev server
pnpm dev
# → http://localhost:3000
```

Jump straight into a lab: **https://kubeforge.vercel.app/lesson/a1**

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

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript 5 |
| Styling | Tailwind CSS v4 + custom dark theme |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Cluster diagrams | React Flow (`reactflow`) |
| YAML parsing | `js-yaml` |
| Lesson content | MDX via `next-mdx-remote/rsc` |
| State | Zustand (with `persist` for EKS toggle) |
| Database | SQLite via Prisma 5 |
| Testing | Vitest (unit) + Playwright (e2e) |
| Package manager | pnpm |

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
│   ├── AppShell.tsx          # Top nav + sidebar wrapper
│   └── EksToggle.tsx         # Vanilla K8s / EKS mode switch
├── lib/
│   ├── simulator/            # In-memory K8s cluster state machine
│   │   ├── index.ts          # ClusterSimulator class + apply/tick/query API
│   │   ├── reconciler.ts     # Deployment→RS→Pod, scheduling, crash detection
│   │   ├── types.ts          # K8s object types (Pod, Deployment, Service…)
│   │   └── utils.ts          # Label matching, crash detection, uid helpers
│   ├── verifiers/            # Per-lab assertion functions
│   │   ├── types.ts          # VerifierFn, ObjectiveResult, LabDefinition
│   │   ├── a1.ts             # Fix CrashLoopBackOff verifier
│   │   ├── a2.ts             # Rolling update verifier
│   │   └── a3.ts             # Service selector verifier
│   └── store.ts              # Zustand app store (EKS mode toggle)
├── hooks/
│   └── useSimulator.ts       # React hook — simulator lifecycle + auto-tick
├── content/
│   ├── lessons/              # MDX concept text (one per lab, ≤400 words)
│   └── labs/                 # JSON lab definitions (starter YAML, objectives, hints)
├── prisma/
│   ├── schema.prisma         # User, LabAttempt, LabCompletion, Streak
│   └── migrations/
└── tests/
    ├── unit/                 # Vitest — simulator + store tests
    └── e2e/                  # Playwright — phase smoke tests
```

## Phased Build Plan

| Phase | Goal | Status |
|---|---|---|
| **0** | Scaffolding — app shell, dark mode, EKS toggle, Prisma schema | ✅ Complete |
| **1** | Simulator + labs A1, A2, A3 (CrashLoop fix, rolling update, Service wiring) | ✅ Complete |
| **2** | Curriculum engine, progress/streaks, simulated kubectl terminal, labs A4–A8 | 🔒 Pending |
| **3** | Phase B — Production K8s, probes, HPA, DiskPressure boss lab | 🔒 Pending |
| **4** | Real cluster mode (`kind`) + Phase C (CRDs, webhooks, Istio, ArgoCD) | 🔒 Pending |
| **5** | EKS mode + Phase D (Karpenter, IRSA, ALB, ECR, Fargate, capstone) | 🔒 Pending |
| **6** | Polish — hint animations, CKA exam mode, a11y audit, Lighthouse > 95 | 🔒 Pending |

See `k8s-eks-learning-webapp-prompt.md` for the full spec.

## Available Labs (Phase 1)

| ID | Title | Concept | Real-world incident |
|---|---|---|---|
| [A1](/lesson/a1) | Fix the CrashLoopBackOff | Pods, containers, restartPolicy | 🔥 Yes |
| [A2](/lesson/a2) | Zero-downtime image rollout | ReplicaSets and Deployments | No |
| [A3](/lesson/a3) | Wire the frontend to the backend | Services: ClusterIP, selectors | No |

## Non-Goals (v1)

- No login / multi-tenancy / SaaS scaffolding
- No in-app AI assistant (reveal-solution button only, after 3 failures)
- No telemetry or external API calls beyond K8s docs links
