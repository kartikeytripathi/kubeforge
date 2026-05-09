import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_USER_ID, ensureUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { labId, yaml, passed } = body as { labId: string; yaml: string; passed: boolean };

    if (!labId) return NextResponse.json({ error: "labId required" }, { status: 400 });

    await ensureUser();

    await prisma.labAttempt.create({
      data: { userId: DEFAULT_USER_ID, labId, yaml: yaml ?? "", passed: passed ?? false },
    });

    if (passed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.streak.upsert({
        where: { userId_date: { userId: DEFAULT_USER_ID, date: today } },
        update: { count: { increment: 1 } },
        create: { userId: DEFAULT_USER_ID, date: today, count: 1 },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
