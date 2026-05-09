# KubeForge — Architecture Decisions

Logged in order. Each entry: decision + one-line rationale.

---

## Phase 0

### D-01: Tailwind v4 (not v3)
pnpm resolved tailwindcss@4.x. v4 uses `@import "tailwindcss"` and `@theme {}` instead of `@tailwind base/components/utilities`. Kept v4 to stay current; adjusted `globals.css` and `postcss.config.mjs` accordingly.

### D-02: Zustand `persist` middleware for EKS toggle
The EKS toggle is app-level state that should survive page reloads. `persist` with `localStorage` is the minimal solution; no server round-trip needed for a preference flag.

### D-03: Single `User` row model in Prisma
The spec says "single-user local app, no auth." Rather than a multi-user schema that's never used, we have a single `User` row (id=1) that all attempts/completions reference. Simplifies every query.

### D-04: Kept `shadcn/ui` install deferred to Phase 1
`shadcn/ui` requires running an interactive CLI (`npx shadcn@latest init`) that modifies `components/ui/`. Including it in Phase 0 without actual components being used would leave dead code. Will initialize it in Phase 1 when the first UI primitives (Button, Badge) are actually consumed.

### D-05: `app/` directory without `src/`
Next.js 14 App Router works with or without `src/`. Omitting `src/` keeps the layout shallower and matches the spec's repo layout exactly.

### D-06: Vitest over Jest
Next.js 14 does not require Jest; Vitest is faster, natively ESM, and shares Vite's config model. `@vitejs/plugin-react` provides the JSX transform needed for component tests.

### D-07: Playwright for e2e (not Cypress)
Playwright ships with Chromium, Firefox, and WebKit in one package, has a cleaner async API, and handles Next.js `webServer` launch out of the box via `playwright.config.ts`. No trade-off for a single-dev project.

### D-08: Tailwind custom color tokens via CSS `@theme`
Tailwind v4 replaces `theme.extend.colors` in JS config with CSS custom properties under `@theme`. Defined `--color-surface-*` and `--color-teal-*` there; the JS config still lives for IDE autocomplete compatibility but defers to CSS at runtime.

### D-09: TypeScript downgraded from 6 to 5
TypeScript 6.0 (resolved by pnpm) is incompatible with Next.js 14's CSS side-effect import types. Pinned to `typescript@5` (resolves to 5.9.x) until Next.js 15+ is adopted.

### D-10: `@tailwindcss/postcss` required for Tailwind v4
Tailwind v4 moved its PostCSS plugin to a separate `@tailwindcss/postcss` package. Updated `postcss.config.mjs` to use that package as the only PostCSS plugin (autoprefixer is bundled inside Tailwind v4).

### D-11: `prisma.config.ts` excluded from Next.js TypeScript compilation
Prisma 7 requires a `prisma.config.ts` for the migrate adapter, but Next.js TypeScript would fail on its Prisma-internal types. Excluded the file via `tsconfig.json#exclude` so it is only picked up by the Prisma CLI.

### D-12: Prisma 7 — `url` moved out of `schema.prisma`
Prisma 7 no longer accepts `url = env("DATABASE_URL")` inside `datasource db {}`. Connection URL is now passed via `prisma.config.ts` using a driver adapter. For Phase 0 only `prisma generate` is needed (no migration run yet); the full adapter config is wired up but deferred until `pnpm db:migrate` is run.

---

*Add entries here as non-trivial choices are made in later phases.*
