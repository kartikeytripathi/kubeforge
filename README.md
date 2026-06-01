# KubeForge

A webapp for learning Kubernetes and Amazon EKS through hands-on labs. Every concept ships with a lab; every lab has automated verification.

**Target learner:** Experienced AWS engineer pursuing CKA, moving into a DevOps role.

**Live:** [kubeforge.kartikeytripathi.in](https://kubeforge.kartikeytripathi.in)

---

## Features

- **In-browser Kubernetes cluster** — real `kubectl` commands, no cloud account needed
- **39 hands-on labs** across 4 phases (Phase A → D)
- **Automated lab verification** — pass/fail in milliseconds, not multiple choice
- **"Why this works →" footer** — every lab links to the relevant K8s Internals module section explaining the underlying mechanism
- **K8s Internals modules** — deep-dive guides in `modules/` covering the 10 core internals topics; Module 2 (etcd) live with guide, hands-on lab, and slide deck
- **K8s Knowledge Check** — 60 scenario-based MCQs across Beginner / Intermediate / Advanced (CKA-level) tiers; per-answer explanation reveal, topic scorecard, weak-area highlights
- **Quiz progress persistence** — in-progress quiz state saved to localStorage; resume from last question on return, with 7-day TTL and per-user isolation
- **Responsive layout** — full sidebar on desktop; bottom tab bar + single-panel lab switcher on mobile
- **GitHub OAuth** — sign in with GitHub, progress synced across devices
- **MongoDB-backed progress** — lab attempts, completions, and quiz scores persisted per user
- **Animated landing page** — scroll animations, floating K8s nodes, FAQ accordion
- **Open Graph / SEO** — sitemap.xml, robots.txt, Twitter card metadata
- **New user notifications** — email alert via Resend on every new signup
- **Report an issue** — pre-filled GitHub issue link in the sidebar

---

## Labs

39 labs across 4 phases, all available on the [curriculum page](https://kubeforge.kartikeytripathi.in/curriculum).

| Phase | Title | Labs |
|---|---|---|
| **A** | Foundations (Vanilla K8s) | A1–A8 (8 labs) |
| **B** | Production K8s | B1–B10 (10 labs) |
| **C** | Advanced K8s | C1–C10 (10 labs) |
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
| C10 | Fix the slow admission webhook | 🔥 |

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

## Upcoming

| # | Feature | Status | Description |
|---|---|---|---|
| [#10](https://github.com/kartikeytripathi/kubeforge/issues/10) | **K8s Internals Mastery integration** | ✅ shipped | "Why this works →" footer on every lab; Module 2 (etcd) guide + lab + slides live; c10 diagnostic lab; Phase E syllabus specced in `docs/phase-e-syllabus.md` |
| [#11](https://github.com/kartikeytripathi/kubeforge/issues/11) | **Next Lab button** | planned | After all objectives pass, a button appears to jump directly to the next lab without going back to the curriculum |
| [#12](https://github.com/kartikeytripathi/kubeforge/issues/12) | **Real Cluster Mode** | planned | Opt-in toggle per lab — provisions an isolated vCluster per session, pipes a live `kubectl` terminal (xterm.js) into the lab UI, verifier queries the real cluster instead of the simulator |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript 5 |
| Styling | Tailwind CSS v4 + custom dark theme |
| Auth | NextAuth v5 (GitHub OAuth, JWT sessions) |
| Database | MongoDB Atlas (Mongoose) |
| Email | Resend (new user signup notifications) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Cluster diagrams | React Flow (`reactflow`) |
| YAML parsing | `js-yaml` |
| Lesson content | MDX rendered via `marked` |
| Local state | Zustand with `localStorage` persist |
| Testing | Vitest (unit) + Playwright (e2e) |
| Hosting | Vercel |
| Package manager | pnpm |

---

## Repo Layout

```
kubeforge/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   ├── attempt/              # Record lab attempt → MongoDB
│   │   ├── complete/             # Record lab completion → MongoDB
│   │   ├── progress/             # Fetch user progress from MongoDB
│   │   └── quiz/attempt/         # Record quiz score → MongoDB
│   ├── lesson/[id]/              # Lab pages (server-rendered, force-dynamic)
│   ├── quiz/                     # K8s Knowledge Check
│   │   ├── page.tsx              # Tier landing (Beginner / Intermediate / Advanced)
│   │   └── [tier]/               # Per-tier quiz flow
│   │       ├── page.tsx          # Server component — auth check + load questions
│   │       └── QuizClient.tsx    # Question flow, explanation reveal, scorecard, localStorage resume
│   ├── curriculum/               # Phase/lesson browser
│   ├── progress/                 # Heatmap + readiness gauges
│   ├── settings/                 # Keyboard shortcuts, storage info
│   ├── sitemap.ts                # Auto-generated sitemap.xml (43 URLs)
│   └── robots.ts                 # Auto-generated robots.txt
├── components/
│   ├── LandingPage.tsx           # Animated landing page (unauthenticated)
│   ├── Dashboard.tsx             # Progress dashboard (authenticated)
│   ├── AuthButton.tsx            # GitHub sign in/out + avatar
│   ├── Sidebar.tsx               # Desktop sidebar + mobile bottom tab bar
│   ├── LabPane.tsx               # Three-panel lab layout (desktop) / tab switcher (mobile)
│   ├── YamlEditor.tsx            # Monaco editor (YAML mode)
│   ├── ClusterCanvas.tsx         # React Flow cluster visualisation
│   ├── VerifyPanel.tsx           # Objectives checklist + hints
│   └── AppShell.tsx              # Top nav + sidebar wrapper
├── hooks/
│   └── useInView.ts              # Intersection Observer scroll-reveal hook
├── lib/
│   ├── simulator/                # In-memory K8s cluster state machine
│   │   ├── index.ts              # ClusterSimulator class + apply/tick/query API
│   │   ├── reconciler.ts         # Deployment→RS→Pod, scheduling, crash detection
│   │   ├── types.ts              # K8s object types (Pod, Deployment, Service…)
│   │   └── utils.ts              # Label matching, uid helpers
│   ├── models/
│   │   ├── User.ts               # Mongoose user model (githubId, name, email, avatar)
│   │   ├── LabAttempt.ts         # Mongoose attempt model
│   │   ├── LabCompletion.ts      # Mongoose completion model
│   │   └── QuizAttempt.ts        # Mongoose quiz score model (userId, tier, score, answers)
│   ├── mongoose.ts               # MongoDB connection singleton
│   ├── verifiers/                # Per-lab assertion functions (one file per lab)
│   ├── lab-module-map.ts         # Static map: lab ID → K8s Internals module + guide anchor URL
│   ├── labs.ts                   # VALID_LAB_IDS set
│   └── progress-store.ts         # Zustand progress store (localStorage cache)
├── auth.ts                       # NextAuth full config (Node.js — mongoose + Resend)
├── auth.config.ts                # NextAuth edge config (used by middleware)
├── middleware.ts                  # Route protection — redirects unauthenticated users
├── content/
│   ├── lessons/                  # MDX concept text (one per lab, ≤400 words)
│   ├── labs/                     # JSON lab definitions (starter YAML, objectives, hints, solution)
│   ├── lab-mapping.csv           # Maps every lab to its K8s Internals module section
│   └── questions/                # MCQ question banks (beginner.json, intermediate.json, advanced.json)
├── modules/
│   └── 02-etcd-storage/          # K8s Internals Module 2 (live)
│       ├── guide.md              # Deep-dive reference (8 sections, ~4,000 words)
│       ├── lab.md                # 6 hands-on exercises (kind cluster + etcdctl)
│       ├── lab.sh                # Idempotent cluster setup script
│       └── build-slides.js       # pptxgenjs slide deck generator (15 slides)
├── docs/
│   └── phase-e-syllabus.md       # Phase E design spec — 10 diagnostic labs (E1–E10), one per internals module
└── tests/
    ├── unit/                     # Vitest — simulator + verifier tests
    └── e2e/                      # Playwright — phase smoke tests
```

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in MONGODB_URI, GITHUB_ID, GITHUB_SECRET, AUTH_SECRET, AUTH_URL, RESEND_API_KEY

# 3. Start dev server
pnpm dev
# → http://localhost:3000
```

### Required environment variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GITHUB_ID` | GitHub OAuth App client ID |
| `GITHUB_SECRET` | GitHub OAuth App client secret |
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `AUTH_URL` | App URL (`http://localhost:3000` locally) |
| `RESEND_API_KEY` | Resend API key for signup email notifications |

### GitHub OAuth App setup

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and generate Client Secret → add to `.env.local`

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright e2e tests |
