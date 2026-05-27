import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { LabCompletion } from "@/lib/models/LabCompletion";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  if (!rateLimit(`complete:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { labId, durationMs } = (await req.json()) as {
      labId: string;
      durationMs: number;
    };
    if (!labId) return NextResponse.json({ error: "labId required" }, { status: 400 });

    await connectDB();
    await LabCompletion.findOneAndUpdate(
      { userId: session.user.id, labId },
      { completedAt: new Date(), durationMs: durationMs ?? 0 },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
