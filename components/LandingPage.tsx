"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { KubeForgeIcon } from "./KubeForgeIcon";
import { useInView } from "@/hooks/useInView";

// ── Terminal animation ────────────────────────────────────────────────────────

type LineType = "cmd" | "out" | "dim" | "ok" | "verify" | "gap";

const LINES: { text: string; type: LineType; ms: number }[] = [
  { text: "$ kubectl apply -f deployment.yaml",          type: "cmd",    ms: 600  },
  { text: "deployment.apps/api-server created",          type: "out",    ms: 550  },
  { text: "service/api-svc created",                     type: "out",    ms: 450  },
  { text: "",                                            type: "gap",    ms: 350  },
  { text: "$ kubectl get pods -w",                       type: "cmd",    ms: 550  },
  { text: "NAME                   READY  STATUS    AGE", type: "dim",    ms: 500  },
  { text: "api-6d4f8c9b-xkz9p    0/1    Pending   0s",  type: "out",    ms: 900  },
  { text: "api-6d4f8c9b-xkz9p    1/1    Running   4s",  type: "ok",     ms: 1100 },
  { text: "",                                            type: "gap",    ms: 400  },
  { text: "✓  All objectives met — lab verified!",       type: "verify", ms: 500  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const lineColor: Record<LineType, string> = {
  cmd:    "text-teal-400",
  out:    "text-gray-200",
  dim:    "text-gray-500",
  ok:     "text-emerald-400",
  verify: "text-amber-400",
  gap:    "",
};

function TerminalWindow() {
  const [shown, setShown] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      await sleep(800);
      while (alive.current) {
        for (let i = 1; i <= LINES.length; i++) {
          if (!alive.current) return;
          setShown(i);
          await sleep(LINES[i - 1].ms);
        }
        await sleep(2200);
        if (!alive.current) return;
        setShown(0);
        await sleep(600);
      }
    })();
    return () => { alive.current = false; };
  }, []);

  return (
    <div className="animate-float relative w-full max-w-lg rounded-xl border border-surface-600 bg-surface-800 shadow-2xl shadow-black/60 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-surface-600 bg-surface-900 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-amber-500/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-xs text-gray-500 font-mono">kubeforge — lab a2</span>
      </div>
      <div className="min-h-[200px] p-4 font-mono text-sm leading-relaxed">
        {LINES.slice(0, shown).map((line, i) => {
          const isLast = i === shown - 1;
          return (
            <div key={i} className={`${lineColor[line.type]} ${line.type === "gap" ? "h-3" : ""}`}>
              {line.text}
              {isLast && line.text !== "" && (
                <span className="animate-cursor ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[1px] bg-teal-400 align-middle" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Floating K8s nodes ────────────────────────────────────────────────────────

const NODES = [
  { cls: "animate-drift-1", style: { top: "12%",  left: "8%"  }, size: "h-8 w-8",   opacity: "opacity-10" },
  { cls: "animate-drift-2", style: { top: "25%",  left: "88%" }, size: "h-5 w-5",   opacity: "opacity-[0.07]" },
  { cls: "animate-drift-3", style: { top: "65%",  left: "6%"  }, size: "h-12 w-12", opacity: "opacity-[0.06]" },
  { cls: "animate-drift-4", style: { top: "75%",  left: "82%" }, size: "h-6 w-6",   opacity: "opacity-10" },
  { cls: "animate-drift-5", style: { top: "45%",  left: "92%" }, size: "h-9 w-9",   opacity: "opacity-[0.08]" },
  { cls: "animate-drift-6", style: { top: "8%",   left: "55%" }, size: "h-4 w-4",   opacity: "opacity-10" },
  { cls: "animate-drift-7", style: { top: "85%",  left: "40%" }, size: "h-7 w-7",   opacity: "opacity-[0.07]" },
  { cls: "animate-drift-8", style: { top: "50%",  left: "3%"  }, size: "h-5 w-5",   opacity: "opacity-[0.06]" },
];

function FloatingNodes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {NODES.map((n, i) => (
        <div key={i} className={`absolute ${n.cls} ${n.opacity}`} style={n.style}>
          <KubeForgeIcon className={`${n.size} text-teal-400`} />
        </div>
      ))}
    </div>
  );
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={inView ? "scroll-visible" : "scroll-hidden"}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Real kubectl Interface",
    desc: "Type actual kubectl commands. Every lab runs against an in-browser Kubernetes cluster — no mocks, no click-throughs.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Instant Verification",
    desc: "Submit and get pass/fail in milliseconds. The verifier checks your cluster state — not a quiz, not multiple choice.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    title: "CKA → EKS Curriculum",
    desc: "38 labs across 4 phases. Start with vanilla Kubernetes, advance through production patterns, finish with AWS EKS.",
  },
];

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: "01",
    title: "Read the incident brief",
    desc: "Each lab starts with a real-world scenario — a CrashLoopBackOff, a broken ingress, a misconfigured RBAC. You know exactly what's broken and why it matters.",
  },
  {
    num: "02",
    title: "Fix it with real commands",
    desc: "Open the in-browser YAML editor or type kubectl directly in the terminal. The cluster reacts in real time — pods start, services resolve, probes pass.",
  },
  {
    num: "03",
    title: "Verify and move on",
    desc: "Hit Verify. The lab checker inspects your cluster state against the objectives. Green across the board? Progress is saved. On to the next lab.",
  },
];

// ── Comparison table ──────────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { feature: "Hands-on kubectl practice",      kubeforge: true,  video: false, docs: false },
  { feature: "No cloud account needed",        kubeforge: true,  video: true,  docs: true  },
  { feature: "Automated pass/fail grading",    kubeforge: true,  video: false, docs: false },
  { feature: "Structured CKA → EKS path",     kubeforge: true,  video: true,  docs: false },
  { feature: "Progress synced across devices", kubeforge: true,  video: false, docs: false },
  { feature: "Free forever",                   kubeforge: true,  video: false, docs: true  },
];

// ── Phases ───────────────────────────────────────────────────────────────────

const PHASES = [
  { id: "A", label: "Foundations", labs: 8,  color: "border-teal-600 text-teal-400",     desc: "Pods · Deployments · Services · PVCs · RBAC" },
  { id: "B", label: "Production",  labs: 10, color: "border-blue-500 text-blue-400",     desc: "Probes · HPA · StatefulSets · Ingress · Jobs" },
  { id: "C", label: "Advanced",    labs: 9,  color: "border-violet-500 text-violet-400", desc: "Network Policies · OPA · Mesh · GitOps" },
  { id: "D", label: "AWS EKS",     labs: 13, color: "border-amber-500 text-amber-400",   desc: "IRSA · Karpenter · ALB · Fargate · ECR" },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need a Kubernetes cluster or AWS account?",
    a: "No. KubeForge runs an in-browser Kubernetes simulator — no cloud account, no local install, no kind or minikube setup required. You can start Lab A1 in under 30 seconds.",
  },
  {
    q: "Is this good preparation for the CKA exam?",
    a: "Yes. Phases A and B cover the core CKA curriculum — Pods, Deployments, Services, RBAC, probes, HPA, StatefulSets, Ingress. The lab format (fix a real scenario, verify against objectives) mirrors the CKA exam format closely.",
  },
  {
    q: "What is Phase D — EKS Deep Track?",
    a: "Phase D is 13 labs focused on AWS EKS in production: IRSA, Pod Identity, Karpenter, the AWS Load Balancer Controller, ECR lifecycle policies, Fargate, Spot optimization, and a full capstone incident. It's designed for engineers who already know Kubernetes and want to go deep on EKS.",
  },
  {
    q: "How does lab verification work?",
    a: "Each lab has a set of objectives. When you click Verify, a checker inspects your cluster state — it reads object metadata, checks labels, counts replicas, verifies service selectors, etc. Pass/fail is returned in milliseconds. No multiple choice, no self-grading.",
  },
  {
    q: "Is KubeForge free?",
    a: "Yes, completely free. No credit card, no premium tier, no limits on labs or progress. Sign in with GitHub and start immediately.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-surface-600">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left text-sm font-semibold text-white transition-colors hover:text-teal-400"
          >
            <span>{faq.q}</span>
            <svg
              className={`ml-4 h-5 w-5 shrink-0 text-teal-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-48 pb-5" : "max-h-0"}`}>
            <p className="text-sm leading-relaxed text-gray-400">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── GitHub button ─────────────────────────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function SignInButton({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <button
      onClick={() => signIn("github")}
      className={`animate-pulse-glow inline-flex items-center gap-3 rounded-xl bg-teal-600 font-semibold text-white transition-all hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] ${
        size === "lg" ? "px-8 py-4 text-base" : "px-5 py-2.5 text-sm"
      }`}
    >
      <GitHubIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      Sign in with GitHub
    </button>
  );
}

function CheckIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg className="h-5 w-5 text-teal-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-white overflow-x-hidden">

      {/* ── Minimal nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5 bg-surface-900/70">
        <div className="flex items-center gap-2">
          <KubeForgeIcon className="h-7 w-7 text-teal-600" />
          <span className="text-lg font-bold tracking-tight">KubeForge</span>
        </div>
        <SignInButton size="sm" />
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Grid background */}
        <div
          className="animate-grid-pan pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Floating K8s nodes */}
        <FloatingNodes />
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(13,148,136,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-900 to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="w-full lg:w-1/2 animate-fade-in-up">
            <TerminalWindow />
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-teal-600/40 bg-teal-600/10 px-4 py-1.5 text-xs font-semibold text-teal-400 tracking-wider" style={{ animationDelay: "100ms" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              38 HANDS-ON LABS · PHASE A → D
            </div>
            <h1 className="animate-fade-in-up text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight lg:text-6xl" style={{ animationDelay: "200ms" }}>
              Learn Kubernetes{" "}<span className="text-teal-400">by doing.</span>
            </h1>
            <p className="animate-fade-in-up text-lg text-gray-400 max-w-md mx-auto lg:mx-0" style={{ animationDelay: "320ms" }}>
              Real kubectl commands. In-browser cluster. Automated lab verification. Go from Kubernetes basics to AWS EKS expert — no cloud account required.
            </p>
            <div className="animate-fade-in-up flex flex-col items-center gap-4 lg:items-start" style={{ animationDelay: "440ms" }}>
              <SignInButton size="lg" />
              <p className="text-xs text-gray-600">Free forever · No credit card · GitHub login</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-surface-600 bg-surface-800/60 px-6 py-8">
        <Reveal>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 sm:gap-12">
            {[
              { value: "38",   label: "Hands-on Labs"   },
              { value: "4",    label: "Learning Phases" },
              { value: "100%", label: "In-browser"      },
              { value: "Free", label: "Always"          },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold text-teal-400">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Feature cards ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="mb-3 text-center text-3xl font-bold">Not another video course</h2>
            <p className="mb-14 text-center text-gray-400">Every concept is learned by solving a real scenario — not watching someone else solve it.</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-surface-600 bg-surface-800 p-6 transition-all duration-300 hover:border-teal-600/50 hover:bg-surface-700 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600/15 text-teal-400">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 bg-surface-800/40 border-y border-surface-600">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold">How it works</h2>
          <p className="mb-14 text-center text-gray-400">
            Three steps. No setup. No cloud account. No waiting for a cluster to spin up.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-start gap-4">
                {/* connector line between steps */}
                {i < HOW_STEPS.length - 1 && (
                  <div className="absolute left-[2.75rem] top-7 hidden h-px w-[calc(100%+2rem)] bg-gradient-to-r from-teal-600/40 to-transparent md:block" />
                )}
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-600/40 bg-teal-600/10 text-xl font-bold text-teal-400">
                  {step.num}
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-3 text-center text-3xl font-bold">
            Why KubeForge?
          </h2>
          <p className="mb-12 text-center text-gray-400">
            Not every learning method is equal. Here&apos;s how KubeForge stacks up.
          </p>

          <div className="overflow-hidden rounded-2xl border border-surface-600">
            {/* header */}
            <div className="grid grid-cols-4 border-b border-surface-600 bg-surface-800 px-6 py-4 text-sm font-semibold">
              <div className="col-span-1 text-gray-400">Feature</div>
              <div className="text-center text-teal-400">KubeForge</div>
              <div className="text-center text-gray-500">Video courses</div>
              <div className="text-center text-gray-500">Docs / blogs</div>
            </div>

            {/* rows */}
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 px-6 py-4 text-sm ${
                  i % 2 === 0 ? "bg-surface-900/40" : "bg-surface-800/30"
                }`}
              >
                <div className="col-span-1 text-gray-300 flex items-center">{row.feature}</div>
                <div className="flex items-center justify-center"><CheckIcon checked={row.kubeforge} /></div>
                <div className="flex items-center justify-center"><CheckIcon checked={row.video} /></div>
                <div className="flex items-center justify-center"><CheckIcon checked={row.docs} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Phase roadmap ── */}
      <section className="px-6 py-16 bg-surface-800/40 border-y border-surface-600">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="mb-3 text-center text-3xl font-bold">Four phases. One complete journey.</h2>
            <p className="mb-12 text-center text-gray-400">From your first Pod to EKS production architecture — structured and progressive.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((ph, i) => (
              <Reveal key={ph.id} delay={i * 80}>
                <div className={`relative rounded-xl border-2 bg-surface-800 p-5 transition-all duration-300 hover:-translate-y-1 ${ph.color.split(" ")[0]}`}>
                  {i < PHASES.length - 1 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-surface-600 lg:block">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`mb-3 text-xs font-bold uppercase tracking-widest ${ph.color.split(" ")[1]}`}>Phase {ph.id}</div>
                  <p className="mb-1 text-base font-semibold text-white">{ph.label}</p>
                  <p className={`mb-3 text-2xl font-bold ${ph.color.split(" ")[1]}`}>{ph.labs} labs</p>
                  <p className="text-xs leading-relaxed text-gray-500">{ph.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built by ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-600 bg-surface-800 px-4 py-1.5 text-xs font-semibold text-gray-400">
            BUILT BY A PRACTITIONER
          </div>
          <h2 className="mb-6 text-3xl font-bold">Made by someone who passed the CKA</h2>
          <p className="mb-6 text-gray-400 leading-relaxed">
            KubeForge was built by an AWS Containers Support Engineer who spent years debugging
            EKS clusters, Karpenter nodepool drift, IRSA misconfigs, and ECR pull failures in
            production — and wanted a learning tool that actually matches that reality.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Every lab is based on real incidents. Every phase mirrors the progression from
            &ldquo;what is a Pod?&rdquo; to &ldquo;why is Karpenter not consolidating my spot nodes?&rdquo;
            No lab is theoretical. No lab is a multiple-choice question.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-20 bg-surface-800/40 border-y border-surface-600">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="mb-3 text-center text-3xl font-bold">Frequently asked</h2>
            <p className="mb-12 text-center text-gray-400">Quick answers to the questions we see most often.</p>
          </Reveal>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(13,148,136,0.12),transparent)]" />
        <Reveal>
          <div className="relative z-10 mx-auto max-w-xl">
            <KubeForgeIcon className="mx-auto mb-6 h-14 w-14 text-teal-600 opacity-90" />
            <h2 className="mb-4 text-4xl font-bold">Ready to get your hands dirty?</h2>
            <p className="mb-10 text-lg text-gray-400">Sign in with GitHub and start Lab A1 in under 30 seconds.</p>
            <div className="flex justify-center">
              <SignInButton size="lg" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-600 px-6 py-8 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <KubeForgeIcon className="h-4 w-4 text-teal-600/60" />
          <span>KubeForge</span>
        </div>
        Built for DevOps engineers, SREs, and CKA candidates. No cloud account required.
      </footer>

    </div>
  );
}
