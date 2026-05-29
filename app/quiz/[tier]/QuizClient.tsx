"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Question } from "./page";

type Answer = { questionId: string; chosen: string; correct: boolean };

// ─── localStorage persistence ─────────────────────────────────────────────────

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CachedProgress = {
  userId: string;
  tier: string;
  currentIndex: number;
  answers: Answer[];
  questionIds: string;  // comma-joined IDs — detects question set changes
  startedAt: number;
};

function cacheKey(userId: string, tier: string) {
  return `quiz:progress:${userId}:${tier}`;
}

function loadProgress(
  userId: string,
  tier: string,
  questions: Question[]
): { currentIndex: number; answers: Answer[] } | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId, tier));
    if (!raw) return null;
    const s = JSON.parse(raw) as CachedProgress;

    if (s.userId !== userId || s.tier !== tier) return null;
    if (Date.now() - s.startedAt > TTL_MS) return null;
    if (s.questionIds !== questions.map((q) => q.id).join(",")) return null;
    if (s.currentIndex > questions.length || s.answers.length !== s.currentIndex) return null;
    if (s.currentIndex === questions.length) return null; // fully done — don't restore

    return { currentIndex: s.currentIndex, answers: s.answers };
  } catch {
    return null;
  }
}

function saveProgress(
  userId: string,
  tier: string,
  currentIndex: number,
  answers: Answer[],
  questions: Question[],
  startedAt: number
) {
  try {
    const data: CachedProgress = {
      userId,
      tier,
      currentIndex,
      answers,
      questionIds: questions.map((q) => q.id).join(","),
      startedAt,
    };
    localStorage.setItem(cacheKey(userId, tier), JSON.stringify(data));
  } catch {}
}

function clearProgress(userId: string, tier: string) {
  try {
    localStorage.removeItem(cacheKey(userId, tier));
  } catch {}
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────

function ScoreCard({
  tier,
  score,
  total,
  answers,
  questions,
  onRetry,
}: {
  tier: string;
  score: number;
  total: number;
  answers: Answer[];
  questions: Question[];
  onRetry: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const topicMap = new Map<string, { correct: number; total: number }>();

  for (const a of answers) {
    const q = questions.find((q) => q.id === a.questionId);
    if (!q) continue;
    const entry = topicMap.get(q.topic) ?? { correct: 0, total: 0 };
    entry.total++;
    if (a.correct) entry.correct++;
    topicMap.set(q.topic, entry);
  }

  const weakTopics = [...topicMap.entries()]
    .filter(([, v]) => v.correct / v.total < 0.6)
    .map(([topic]) => topic);

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const color = pct >= 80 ? "text-teal-400" : pct >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <div className="rounded-xl border border-surface-600 bg-surface-800 p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          {tierLabel} complete
        </p>
        <p className={`mt-2 text-6xl font-bold tabular-nums ${color}`}>
          {score}/{total}
        </p>
        <p className="mt-1 text-gray-400">{pct}% correct</p>
      </div>

      {weakTopics.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Topics to review
          </p>
          <ul className="space-y-1">
            {weakTopics.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-amber-500">·</span>
                {t.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-600">
            <th className="pb-2 text-left text-xs uppercase tracking-wider text-gray-500">Topic</th>
            <th className="pb-2 text-right text-xs uppercase tracking-wider text-gray-500">Score</th>
          </tr>
        </thead>
        <tbody>
          {[...topicMap.entries()].map(([topic, v]) => {
            const topicPct = Math.round((v.correct / v.total) * 100);
            const c = topicPct >= 80 ? "text-teal-400" : topicPct >= 60 ? "text-amber-400" : "text-red-400";
            return (
              <tr key={topic} className="border-b border-surface-600/50">
                <td className="py-2 text-gray-300">{topic.replace(/-/g, " ")}</td>
                <td className={`py-2 text-right font-mono font-semibold ${c}`}>
                  {v.correct}/{v.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex gap-3">
        <Link
          href="/quiz"
          className="flex-1 rounded-lg border border-surface-600 px-4 py-2.5 text-center text-sm font-semibold text-gray-300 hover:bg-surface-700 transition-colors"
        >
          ← All tiers
        </Link>
        <button
          onClick={onRetry}
          className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── QuizPane ─────────────────────────────────────────────────────────────────

function QuizPane({
  question,
  index,
  total,
  onAnswer,
}: {
  question: Question;
  index: number;
  total: number;
  onAnswer: (chosen: string, correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const revealed = chosen !== null;
  const isCorrect = chosen === question.correct;

  function pick(id: string) {
    if (revealed) return;
    setChosen(id);
    onAnswer(id, id === question.correct);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-surface-700 px-3 py-1 text-xs font-mono text-gray-400">
          {question.topic.replace(/-/g, " ")}
        </span>
        <span className="text-xs text-gray-500">
          {index + 1} / {total}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-gray-200">{question.scenario}</p>

      <div className="space-y-2">
        {question.options.map((opt) => {
          let cls = "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ";
          if (!revealed) {
            cls += "border-surface-600 bg-surface-800 text-gray-300 hover:border-teal-500/60 hover:bg-surface-700 cursor-pointer";
          } else if (opt.id === question.correct) {
            cls += "border-teal-500 bg-teal-500/10 text-teal-300 cursor-default";
          } else if (opt.id === chosen) {
            cls += "border-red-500 bg-red-500/10 text-red-300 cursor-default";
          } else {
            cls += "border-surface-600 bg-surface-800 text-gray-500 cursor-default opacity-60";
          }
          return (
            <button key={opt.id} className={cls} onClick={() => pick(opt.id)}>
              <span className="mr-2 font-mono text-gray-500">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          className={`rounded-xl border p-4 ${
            isCorrect ? "border-teal-500/30 bg-teal-500/5" : "border-red-500/30 bg-red-500/5"
          }`}
        >
          {isCorrect ? (
            <>
              <p className="mb-1 text-xs font-semibold text-teal-400">Correct</p>
              <p className="text-sm text-gray-300">{question.explanation}</p>
            </>
          ) : (
            <>
              <p className="mb-1 text-xs font-semibold text-red-400">Incorrect</p>
              <p className="text-sm text-gray-300">{question.wrongHint}</p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">
                  Show full explanation
                </summary>
                <p className="mt-2 text-sm text-gray-400">{question.explanation}</p>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuizClient({
  tier,
  questions,
  userId,
}: {
  tier: string;
  questions: Question[];
  userId: string;
}) {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<Answer | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeBanner, setResumeBanner] = useState(false);

  // Restore saved progress on mount (client-only)
  useEffect(() => {
    const saved = loadProgress(userId, tier, questions);
    if (saved && saved.currentIndex > 0) {
      setCurrentIndex(saved.currentIndex);
      setAnswers(saved.answers);
      setResumeBanner(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const total = questions.length;
  const current = questions[currentIndex];

  const handleAnswer = useCallback(
    (chosen: string, correct: boolean) => {
      setPendingAnswer({ questionId: current.id, chosen, correct });
    },
    [current]
  );

  async function handleNext() {
    if (!pendingAnswer) return;
    setResumeBanner(false);
    const next = [...answers, pendingAnswer];
    setAnswers(next);
    setPendingAnswer(null);

    if (currentIndex + 1 >= total) {
      const score = next.filter((a) => a.correct).length;
      setSaving(true);
      try {
        await fetch("/api/quiz/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, score, total, answers: next }),
        });
      } finally {
        clearProgress(userId, tier);
        setSaving(false);
        setDone(true);
      }
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      // Save after advancing — only committed answers are persisted
      saveProgress(userId, tier, nextIndex, next, questions, startedAtRef.current);
    }
  }

  function handleRetry() {
    clearProgress(userId, tier);
    startedAtRef.current = Date.now();
    setCurrentIndex(0);
    setAnswers([]);
    setPendingAnswer(null);
    setDone(false);
    router.refresh();
  }

  if (done) {
    const score = answers.filter((a) => a.correct).length;
    return (
      <ScoreCard
        tier={tier}
        score={score}
        total={total}
        answers={answers}
        questions={questions}
        onRetry={handleRetry}
      />
    );
  }

  const progress = ((currentIndex / total) * 100).toFixed(0);

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/quiz" className="text-xs text-gray-500 hover:text-gray-300">
          ← Quiz home
        </Link>
        <span className="text-xs font-semibold capitalize text-gray-400">{tier}</span>
      </div>

      {resumeBanner && (
        <div className="flex items-center justify-between rounded-lg border border-teal-500/30 bg-teal-500/5 px-4 py-2.5">
          <p className="text-xs text-teal-400">
            Resuming from question {currentIndex + 1} of {total}
          </p>
          <button
            onClick={handleRetry}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Start over
          </button>
        </div>
      )}

      <div className="h-1.5 w-full rounded-full bg-surface-700">
        <div
          className="h-1.5 rounded-full bg-teal-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <QuizPane
        key={current.id}
        question={current}
        index={currentIndex}
        total={total}
        onAnswer={handleAnswer}
      />

      {pendingAnswer && (
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors"
        >
          {saving
            ? "Saving…"
            : currentIndex + 1 >= total
            ? "Finish & see score"
            : "Next question →"}
        </button>
      )}
    </div>
  );
}
