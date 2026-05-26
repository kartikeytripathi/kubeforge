import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { LabAttempt } from "@/lib/models/LabAttempt";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { labId, yaml, passed } = (await req.json()) as {
      labId: string;
      yaml: string;
      passed: boolean;
    };
    if (!labId) return NextResponse.json({ error: "labId required" }, { status: 400 });

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
