import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { LabAttempt } from "@/lib/models/LabAttempt";
import { rateLimit } from "@/lib/rateLimit";
import { VALID_LAB_IDS } from "@/lib/labs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  if (!rateLimit(`attempt:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { labId, yaml, passed } = (await req.json()) as {
      labId: string;
      yaml: string;
      passed: boolean;
    };
    if (!labId || !VALID_LAB_IDS.has(labId)) {
      return NextResponse.json({ error: "invalid labId" }, { status: 400 });
    }

    await connectDB();
    await LabAttempt.create({
      userId: session.user.id,
      labId,
      yaml: yaml ?? "",
      passed: passed ?? false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
