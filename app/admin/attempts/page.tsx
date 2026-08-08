'use client';
import { useEffect, useState } from 'react';
import { AttemptRow } from '@/types';

export default function AdminAttempts() {
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);

  useEffect(() => {
    fetch('/api/admin/attempts').then(r => r.json()).then(d => setAttempts(d.attempts));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Student Attempts</h1>
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Question</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Student</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">SQL</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Result</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                <td className="text-white px-6 py-4 text-sm">{a.question_title}</td>
                <td className="text-gray-300 px-6 py-4 text-sm">{a.student_id}</td>
                <td className="text-gray-300 px-6 py-4 text-sm font-mono max-w-xs truncate">{a.submitted_sql}</td>
                <td className="px-6 py-4">
                  {a.is_correct
                    ? <span className="text-green-400 text-sm font-medium">✅ Correct</span>
                    : <span className="text-red-400 text-sm font-medium">❌ Incorrect</span>}
                </td>
                <td className="text-gray-400 px-6 py-4 text-sm">{new Date(a.executed_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
