import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { QuizAttempt } from "@/lib/models/QuizAttempt";
import { rateLimit } from "@/lib/rateLimit";

const VALID_TIERS = new Set(["beginner", "intermediate", "advanced"]);

type Answer = { questionId: string; chosen: string; correct: boolean };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  if (!rateLimit(`quiz:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { tier, score, total, answers } = (await req.json()) as {
      tier: string;
      score: number;
      total: number;
      answers: Answer[];
    };

    if (!tier || !VALID_TIERS.has(tier)) {
      return NextResponse.json({ error: "invalid tier" }, { status: 400 });
    }
    if (typeof score !== "number" || typeof total !== "number") {
      return NextResponse.json({ error: "invalid score" }, { status: 400 });
    }

    await connectDB();
    await QuizAttempt.create({
      userId: session.user.id,
      tier,
      score,
      total,
      answers: answers ?? [],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
