'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Assessment } from '@/types';

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const load = () => {
    fetch('/api/admin/assessments').then(r => r.json()).then(d => setAssessments(d.assessments));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: number, current: number) => {
    await fetch(`/api/admin/assessments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: current === 0 }),
    });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Assessments</h1>
        <Link href="/admin/assessments/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
            + Create Assessment
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {assessments.map(a => (
          <div key={a.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">{a.title}</h2>
              <div className="flex gap-4 mt-1">
                <span className="text-gray-400 text-sm">Code: <span className="text-blue-400 font-mono font-bold">{a.access_code}</span></span>
                <span className="text-gray-400 text-sm">⏱ {a.time_limit_mins} mins</span>
                <span className="text-gray-400 text-sm">📝 {a.question_count} questions</span>
                <span className="text-gray-400 text-sm">👥 {a.submission_count} submissions</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${a.is_active ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {a.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded-lg transition-colors"
              >
                {a.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <Link href={`/admin/assessments/${a.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                View Results →
              </Link>
            </div>
          </div>
        ))}
        {assessments.length === 0 && (
          <div className="text-gray-500 text-center py-16">No assessments yet. Create one to get started.</div>
        )}
      </div>
    </div>
  );
}
