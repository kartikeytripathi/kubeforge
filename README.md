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
pnpm db:migrate

# Run the dev server
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

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS (v4) |
| State | Zustand |
| Database | SQLite via Prisma |
| Testing | Vitest + Playwright |

## Repo Layout

```
kubeforge/
├── app/                      # Next.js App Router pages + API routes
├── components/               # Reusable UI (AppShell, Sidebar, TopNav, EksToggle…)
├── lib/
│   ├── simulator/            # In-memory K8s cluster simulator (Phase 1+)
│   ├── verifiers/            # Per-lab assertion functions (Phase 1+)
│   ├── schemas/              # Bundled K8s OpenAPI schemas (Phase 1+)
│   └── curriculum/           # Lesson + lab content helpers (Phase 2+)
├── content/
│   ├── lessons/              # MDX files, one per concept (Phase 1+)
│   └── labs/                 # JSON lab definitions (Phase 1+)
├── prisma/                   # Prisma schema + migrations
└── tests/
    ├── unit/                 # Vitest unit tests
    └── e2e/                  # Playwright e2e tests
```

## Phased Build Plan

| Phase | Goal | Status |
|---|---|---|
| **0** | Scaffolding — empty app boots, dark mode, two placeholder pages | ✅ Complete |
| **1** | Simulator + first 3 labs (A1, A2, A3) | 🔒 Pending |
| **2** | Curriculum engine + Phase A complete | 🔒 Pending |
| **3** | Phase B — Production K8s + boss-lab framework | 🔒 Pending |
| **4** | Real cluster mode (kind) + Phase C | 🔒 Pending |
| **5** | EKS mode + Phase D | 🔒 Pending |
| **6** | Polish — hints, confetti, CKA exam mode, a11y | 🔒 Pending |

See `k8s-eks-learning-webapp-prompt.md` for the full spec.

## Non-Goals (v1)

- No login / multi-tenancy
- No in-app AI assistant
- No telemetry or external API calls beyond K8s docs links
