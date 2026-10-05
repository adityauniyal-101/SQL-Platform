'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import { isTourDone, markTourDone } from '@/components/GuidedTour';
import { Question } from '@/types';

const HOW_IT_WORKS = [
  { n: 1, title: 'Pick a question', body: 'Start with an easy one. Each comes with the tables you can use.' },
  { n: 2, title: 'Write SQL', body: 'Type your query in the editor and run it against a real database.' },
  { n: 3, title: 'Get instant feedback', body: 'See your rows and whether they match. Retry as often as you like.' },
];

export default function Home() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShowWelcome(!isTourDone());
  }, []);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load questions.');
        setIsLoading(false);
      });
  }, []);

  const firstQuestion = questions.find((q) => q.difficulty === 'easy') ?? questions[0];

  const startTour = () => {
    if (firstQuestion) router.push(`/questions/${firstQuestion.id}?tour=1`);
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
    markTourDone();
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">SQL Practice</h1>
            <p className="mt-2 text-gray-400">
              Sharpen your SQL skills with hands-on questions against a real database.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={startTour}
              disabled={!firstQuestion}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              How it works
            </button>
            <Link
              href="/assessment"
              className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
            >
              Take an Assessment →
            </Link>
          </div>
        </div>

        {showWelcome && (
          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-blue-500/40 bg-blue-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">New here? Take the 2-minute guided tour.</p>
              <p className="mt-1 text-sm text-gray-300">
                We&apos;ll walk you through solving your first question, step by step.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={dismissWelcome}
                className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                No thanks
              </button>
              <button
                onClick={startTour}
                disabled={!firstQuestion}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Start tour
              </button>
            </div>
          </div>
        )}

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs font-semibold text-blue-400">
                  {s.n}
                </span>
                <span className="text-sm font-semibold text-white">{s.title}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">{s.body}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">Questions</h2>
        <div className="mt-4 space-y-4">
          {isLoading && (
            <p className="text-gray-400">Loading questions...</p>
          )}

          {error && (
            <p className="text-red-400">{error}</p>
          )}

          {!isLoading && !error && questions.length === 0 && (
            <p className="text-gray-400">No questions available yet.</p>
          )}

          {questions.map((q) => (
            <QuestionCard key={q.id} id={q.id} title={q.title} difficulty={q.difficulty} />
          ))}
        </div>
      </div>
    </div>
  );
}
