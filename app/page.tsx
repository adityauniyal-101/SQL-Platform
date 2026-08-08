'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import { Question } from '@/types';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">SQL Practice</h1>
            <p className="mt-2 text-gray-400">
              Sharpen your SQL skills with hands-on questions against a real database.
            </p>
          </div>
          <Link
            href="/assessment"
            className="shrink-0 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
          >
            Take an Assessment →
          </Link>
        </div>

        <div className="mt-8 space-y-4">
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
