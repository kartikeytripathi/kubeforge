import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

const TIERS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Pod lifecycle, Services, ConfigMaps, basic troubleshooting",
    count: 20,
    color: "teal",
    badge: "K8s fundamentals",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "StatefulSets, RBAC, HPA, probes, storage, networking",
    count: 20,
    color: "amber",
    badge: "Production K8s",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "CKA-level: CRDs, admission webhooks, scheduler, EKS, Karpenter",
    count: 20,
    color: "purple",
    badge: "CKA level",
  },
];

const COLOR = {
  teal:   { ring: "border-teal-500/40",   badge: "bg-teal-500/10 text-teal-400",   btn: "bg-teal-600 hover:bg-teal-500" },
  amber:  { ring: "border-amber-500/40",  badge: "bg-amber-500/10 text-amber-400",  btn: "bg-amber-600 hover:bg-amber-500" },
  purple: { ring: "border-purple-500/40", badge: "bg-purple-500/10 text-purple-400", btn: "bg-purple-600 hover:bg-purple-500" },
} as const;

export default async function QuizLandingPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/quiz");

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">K8s Knowledge Check</h1>
        <p className="mt-1 text-gray-400">
          20 scenario-based questions per tier. Each answer reveals a detailed explanation.
          Complete all 20 to see your scorecard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const c = COLOR[tier.color as keyof typeof COLOR];
          return (
            <div
              key={tier.id}
              className={`flex flex-col rounded-xl border ${c.ring} bg-surface-800 p-5`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                  {tier.badge}
                </span>
                <span className="text-xs text-gray-500">{tier.count} questions</span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-white">{tier.label}</h2>
              <p className="mt-1 flex-1 text-sm text-gray-400">{tier.description}</p>
              <Link
                href={`/quiz/${tier.id}`}
                className={`mt-4 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors ${c.btn}`}
              >
                Start →
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600">
        Your scores are saved to your account after completing each tier.
      </p>
    </div>
  );
}
