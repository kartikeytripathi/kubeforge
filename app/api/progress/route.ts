import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { LabAttempt } from "@/lib/models/LabAttempt";
import { LabCompletion } from "@/lib/models/LabCompletion";

export const dynamic = "force-dynamic";

const EMPTY = {
  completedLabs: [],
  totalAttempts: 0,
  ckaReadiness: 0,
  eksReadiness: 0,
  currentStreak: 0,
  activityDays: [],
};

function calcStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(key(cursor))) return 0;
  }
  let count = 0;
  for (let i = 0; i < 365; i++) {
    if (!set.has(key(cursor))) break;
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(EMPTY);

  try {
    await connectDB();
    const userId = session.user.id;

    const [completions, attempts] = await Promise.all([
      LabCompletion.find({ userId }).lean(),
      LabAttempt.find({ userId }).lean(),
    ]);

    const completedIds = (completions as Array<{ labId: string }>).map((c) => c.labId);
    const phaseADone = completedIds.filter((id) => id.startsWith("a")).length;

    const activityDays = [
      ...new Set(
        (attempts as Array<{ passed: boolean; createdAt: Date }>)
          .filter((a) => a.passed)
          .map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
      ),
    ];

    return NextResponse.json({
      completedLabs: completedIds,
      totalAttempts: attempts.length,
      ckaReadiness: Math.round((phaseADone / 8) * 25),
      eksReadiness: 0,
      currentStreak: calcStreak(activityDays),
      activityDays,
    });
  } catch {
    return NextResponse.json(EMPTY);
  }
}
