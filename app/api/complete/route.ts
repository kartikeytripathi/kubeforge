import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { LabCompletion } from "@/lib/models/LabCompletion";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

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
