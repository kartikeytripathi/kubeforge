import { NextResponse } from "next/server";
import { prisma, DEFAULT_USER_ID, ensureUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureUser();

    const [completions, attempts, streaks] = await Promise.all([
      prisma.labCompletion.findMany({ where: { userId: DEFAULT_USER_ID } }),
      prisma.labAttempt.findMany({ where: { userId: DEFAULT_USER_ID } }),
      prisma.streak.findMany({ where: { userId: DEFAULT_USER_ID }, orderBy: { date: "desc" } }),
    ]);

    const totalLabs = 38;
    const completedIds = completions.map((c) => c.labId);
    const phaseATotal = 8;
    const phaseADone = completedIds.filter((id) => id.startsWith("a")).length;

    const currentStreak = streaks.reduce((acc, s) => acc + s.count, 0);

    return NextResponse.json({
      completedLabs: completedIds,
      totalAttempts: attempts.length,
      ckaReadiness: Math.round((phaseADone / phaseATotal) * 25),
      eksReadiness: 0,
      currentStreak,
      activityDays: streaks.map((s) => s.date),
    });
  } catch {
    return NextResponse.json({
      completedLabs: [],
      totalAttempts: 0,
      ckaReadiness: 0,
      eksReadiness: 0,
      currentStreak: 0,
      activityDays: [],
    });
  }
}
