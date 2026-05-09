import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_USER_ID, ensureUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { labId, durationMs } = body as { labId: string; durationMs: number };

    if (!labId) return NextResponse.json({ error: "labId required" }, { status: 400 });

    await ensureUser();

    await prisma.labCompletion.upsert({
      where: { userId_labId: { userId: DEFAULT_USER_ID, labId } },
      update: { completedAt: new Date(), durationMs: durationMs ?? 0 },
      create: { userId: DEFAULT_USER_ID, labId, durationMs: durationMs ?? 0 },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
