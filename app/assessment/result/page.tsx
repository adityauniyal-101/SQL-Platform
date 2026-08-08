'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ResultContent() {
  const params = useSearchParams();
  const score = parseInt(params.get('score') || '0');
  const total = parseInt(params.get('total') || '1');
  const pct = Math.round((score / total) * 100);

  const grade = pct >= 80 ? { label: 'Excellent', color: 'text-green-400' } :
                pct >= 60 ? { label: 'Good', color: 'text-blue-400' } :
                pct >= 40 ? { label: 'Average', color: 'text-yellow-400' } :
                            { label: 'Needs Work', color: 'text-red-400' };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete</h1>
        <p className="text-gray-400 mb-8">Your responses have been submitted.</p>

        <div className="text-7xl font-bold text-white mb-2">{pct}%</div>
        <div className={`text-xl font-semibold mb-2 ${grade.color}`}>{grade.label}</div>
        <div className="text-gray-400 mb-8">{score} out of {total} correct</div>

        <Link href="/assessment">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
