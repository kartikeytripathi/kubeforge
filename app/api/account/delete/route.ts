import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models/User";
import { LabAttempt } from "@/lib/models/LabAttempt";
import { LabCompletion } from "@/lib/models/LabCompletion";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = session.user.id;

  await connectDB();
  await Promise.all([
    LabAttempt.deleteMany({ userId }),
    LabCompletion.deleteMany({ userId }),
    User.deleteOne({ githubId: userId }),
  ]);

  return NextResponse.json({ ok: true });
}
