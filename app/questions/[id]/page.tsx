'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SqlEditor from '@/components/SqlEditor';
import ResultTable from '@/components/ResultTable';
import GuidedTour, { markTourDone, TourStep } from '@/components/GuidedTour';
import SchemaReference from '@/components/SchemaReference';
import { ExecuteResponse, Question } from '@/types';

const DIFFICULTY_STYLES: Record<Question['difficulty'], string> = {
  easy: 'bg-green-500/10 text-green-400 border border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

function tourSampleSql(table: string) {
  return `-- Tour: peek at the first 5 rows of ${table} (not the answer!)\nSELECT * FROM ${table} LIMIT 5;`;
}

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
  const [tourOpen, setTourOpen] = useState(false);
  const [firstTable, setFirstTable] = useState<string | null>(null);

  // Started from the home page with ?tour=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tour') === '1') setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    markTourDone();
    const url = new URL(window.location.href);
    if (url.searchParams.has('tour')) {
      url.searchParams.delete('tour');
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, []);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: 'task',
      title: 'This is your task',
      body: 'Each question describes the result you need to produce. Bold words are the important details: which columns, filters and sort order.',
    },
    {
      target: 'schema',
      title: 'The tables you can query',
      body: 'This is the database your query runs against: table names and their columns. Keep it open while you write.',
    },
    {
      target: 'editor',
      title: 'Write SQL here',
      body: "We've typed a starter query for you. It just peeks at the data and isn't the answer. You can edit it like any code editor.",
      onEnter: () => {
        setSql(tourSampleSql(firstTable ?? 'sqlite_master'));
        setResult(null);
      },
    },
    {
      target: 'run',
      title: 'Run it',
      body: (
        <>
          Click <strong className="text-white">Run Query</strong> (or press <kbd className="rounded bg-gray-800 px-1 text-xs">Ctrl</kbd>+<kbd className="rounded bg-gray-800 px-1 text-xs">Enter</kbd>). Your query runs against a real database, read-only, so you can&apos;t break anything.
        </>
      ),
      waitFor: 'result',
    },
    {
      target: 'result',
      title: 'Instant feedback',
      body: (
        <>
          Your rows appear here, compared with the expected output.
          <span className="mt-2 block"><span className="text-green-400">Green</span> = correct. <span className="text-red-400">Red</span> = query ran but the rows don&apos;t match yet. <span className="text-orange-400">Orange</span> = SQL error, with the message to help you fix it.</span>
          <span className="mt-2 block">Attempts are unlimited, so keep iterating.</span>
        </>
      ),
    },
    {
      target: 'back',
      title: "You're ready",
      body: 'Head back to the question list any time. When you feel confident, try a timed assessment from the home page. You can replay this tour from "How it works".',
    },
  ], [firstTable]);

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
    if (!question || isLoading) return;
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              data-tour="back"
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to questions
            </button>
            <button
              onClick={() => setTourOpen(true)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              How it works
            </button>
          </div>

          <div data-tour="task">
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
          </div>

          <div className="mt-8" data-tour="schema">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Schema Reference
            </h2>
            <div className="mt-3">
              <SchemaReference
                datasetName={question.dataset_name}
                onLoad={(tables) => setFirstTable(tables[0]?.name ?? null)}
              />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="p-6 lg:w-[60%]">
          <div data-tour="editor">
            <SqlEditor value={sql} onChange={setSql} onRun={runQuery} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              data-tour="run"
              onClick={runQuery}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Running...' : 'Run Query'}
            </button>
            <span className="hidden text-xs text-gray-500 sm:inline">
              or press <kbd className="rounded border border-gray-700 px-1">Ctrl</kbd> + <kbd className="rounded border border-gray-700 px-1">Enter</kbd>
            </span>
          </div>

          <div className="mt-6 min-h-[3rem]" data-tour="result">
            {!isLoading && !result && (
              <p className="text-sm text-gray-500">Run your query to see the output and whether it&apos;s correct.</p>
            )}

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
                    ❌ Not quite. Your query ran, but its rows don&apos;t match the expected output. Compare the columns, filters and order, then try again.
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

      <GuidedTour
        steps={tourSteps}
        open={tourOpen}
        onClose={closeTour}
        signals={{ result: !isLoading && result !== null }}
      />
    </div>
  );
}
