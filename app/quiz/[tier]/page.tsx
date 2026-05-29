import { notFound, redirect } from "next/navigation";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";
import { QuizClient } from "./QuizClient";

export type Question = {
  id: string;
  tier: string;
  topic: string;
  scenario: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
  wrongHint: string;
};

const VALID_TIERS = new Set(["beginner", "intermediate", "advanced"]);

function loadQuestions(tier: string): Question[] {
  const p = path.join(process.cwd(), "content", "questions", `${tier}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as Question[];
}

export default async function QuizTierPage({ params }: { params: { tier: string } }) {
  const { tier } = params;
  if (!VALID_TIERS.has(tier)) return notFound();

  const session = await auth();
  if (!session?.user) redirect(`/api/auth/signin?callbackUrl=/quiz/${tier}`);

  const questions = loadQuestions(tier);
  if (questions.length === 0) return notFound();

  return <QuizClient tier={tier} questions={questions} userId={session.user.id!} />;
}
