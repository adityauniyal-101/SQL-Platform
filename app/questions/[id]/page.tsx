'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SqlEditor from '@/components/SqlEditor';
import ResultTable from '@/components/ResultTable';
import { ExecuteResponse, Question } from '@/types';

const DIFFICULTY_STYLES: Record<Question['difficulty'], string> = {
  easy: 'bg-green-500/10 text-green-400 border border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

const SCHEMA_REFERENCE = [
  'customers(id, name, email, city, created_at)',
  'products(id, name, category, price, stock)',
  'orders(id, customer_id, order_date, status)',
  'order_items(id, order_id, product_id, quantity, unit_price)',
];

function renderDescription(description: string) {
  // Render **bold** segments and preserve newlines.
  const lines = description.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2'}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function QuestionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sql, setSql] = useState('-- Write your SQL query here\nSELECT ');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResponse | null>(null);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data: { questions: Question[] }) => {
        const found = data.questions?.find((q) => String(q.id) === params.id) ?? null;
        setQuestion(found);
        setNotFound(!found);
        setIsQuestionLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setIsQuestionLoading(false);
      });
  }, [params.id]);

  const runQuery = async () => {
    if (!question) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: question.id, sql }),
      });
      const data: ExecuteResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isQuestionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading question...</p>
      </div>
    );
  }

  if (notFound || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950">
        <p className="text-gray-400">Question not found.</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          ← Back to questions
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex flex-col lg:flex-row">
        {/* Left panel */}
        <div className="border-b border-gray-800 p-6 lg:w-[40%] lg:border-b-0 lg:border-r lg:overflow-y-auto lg:h-screen">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back to questions
          </button>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-white">{question.title}</h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${DIFFICULTY_STYLES[question.difficulty]}`}
            >
              {question.difficulty}
            </span>
          </div>

          <div className="mt-4 text-sm leading-relaxed text-gray-300">
            {renderDescription(question.description)}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Schema Reference
            </h2>
            <div className="mt-3 rounded-lg border border-gray-700 bg-gray-900 p-4">
              <ul className="space-y-2 font-mono text-xs text-gray-300">
                {SCHEMA_REFERENCE.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="p-6 lg:w-[60%]">
          <SqlEditor value={sql} onChange={setSql} />

          <button
            onClick={runQuery}
            disabled={isLoading}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Running...' : 'Run Query'}
          </button>

          <div className="mt-6">
            {isLoading && (
              <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
                Executing query...
              </div>
            )}

            {!isLoading && result && (
              <div className="space-y-4">
                {result.success && result.is_correct && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
                    ✅ Correct! Well done.
                  </div>
                )}

                {result.success && !result.is_correct && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                    ❌ Incorrect. Check your output.
                  </div>
                )}

                {!result.success && (
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-400">
                    ⚠️ {result.error ?? 'An error occurred while running your query.'}
                  </div>
                )}

                {result.success && result.student_columns && result.student_result && (
                  <ResultTable columns={result.student_columns} rows={result.student_result} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
