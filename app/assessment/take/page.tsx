'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dataset_name: string;
}

interface Session {
  submission_id: number;
  assessment_title: string;
  time_limit_mins: number;
  questions: Question[];
  started_at: number;
}

interface RunResult {
  success: boolean;
  student_result?: Record<string, unknown>[];
  student_columns?: string[];
  error?: string;
}

export default function TakeAssessment() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sqls, setSqls] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, RunResult>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('assessment_session');
    if (!raw) { router.push('/assessment'); return; }
    const s: Session = JSON.parse(raw);
    setSession(s);
    const elapsed = Math.floor((Date.now() - s.started_at) / 1000);
    const totalSecs = s.time_limit_mins * 60;
    const remaining = totalSecs - elapsed;
    if (remaining <= 0) { handleSubmit(s); return; }
    setTimeLeft(remaining);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (session) handleSubmit(session);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, session]);

  const handleSubmit = useCallback(async (s?: Session) => {
    const activeSession = s || session;
    if (!activeSession) return;
    setSubmitting(true);
    const res = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: activeSession.submission_id }),
    });
    const data = await res.json();
    localStorage.removeItem('assessment_session');
    router.push(`/assessment/result?submission_id=${activeSession.submission_id}&score=${data.score}&total=${data.total}`);
  }, [session, router]);

  const handleRun = async () => {
    if (!session) return;
    const question = session.questions[currentIndex];
    const sql = sqls[question.id] || '';
    if (!sql.trim()) return;
    setRunning(true);
    const res = await fetch('/api/assessment/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: session.submission_id, question_id: question.id, sql }),
    });
    const data = await res.json();
    setResults(prev => ({ ...prev, [question.id]: data }));
    setRunning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!session) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  const question = session.questions[currentIndex];
  const result = results[question.id];
  const isUrgent = timeLeft < 300; // under 5 mins

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-white font-semibold">{session.assessment_title}</span>
          <span className="text-gray-400 text-sm ml-4">Question {currentIndex + 1} of {session.questions.length}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className={`font-mono font-bold text-xl ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>

      {/* Question nav */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-2 flex gap-2">
        {session.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              i === currentIndex ? 'bg-blue-600 text-white' :
              sqls[q.id] ? 'bg-gray-700 text-green-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-2/5 p-6 border-r border-gray-700 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-bold text-xl">{question.title}</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
              question.difficulty === 'easy' ? 'bg-green-900 text-green-400' :
              question.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-400' :
              'bg-red-900 text-red-400'
            }`}>{question.difficulty}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{question.description}</p>

          <div className="mt-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Schema Reference</p>
            <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400 font-mono space-y-1">
              <div>customers(id, name, email, city, created_at)</div>
              <div>products(id, name, category, price, stock)</div>
              <div>orders(id, customer_id, order_date, status)</div>
              <div>order_items(id, order_id, product_id, quantity, unit_price)</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-950 border border-yellow-800 rounded-lg">
            <p className="text-yellow-400 text-xs">⚠️ Assessment Mode: Results are shown but correct/incorrect is revealed only after submission.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col p-6">
          <MonacoEditor
            height="250px"
            language="sql"
            theme="vs-dark"
            value={sqls[question.id] || ''}
            onChange={val => setSqls(prev => ({ ...prev, [question.id]: val || '' }))}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />

          <button
            onClick={handleRun}
            disabled={running}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors w-fit"
          >
            {running ? 'Running...' : 'Run Query'}
          </button>

          {result && (
            <div className="mt-4">
              {result.error ? (
                <div className="bg-orange-950 border border-orange-700 rounded-lg p-3 text-orange-400 text-sm">
                  ⚠️ {result.error}
                </div>
              ) : (
                <div className="overflow-auto max-h-64 rounded-lg border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800">
                        {result.student_columns?.map(col => (
                          <th key={col} className="text-left text-gray-400 px-4 py-2 font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.student_result?.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                          {result.student_columns?.map(col => (
                            <td key={col} className="text-gray-300 px-4 py-2">{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
