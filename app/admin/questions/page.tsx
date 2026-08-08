'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminQuestion } from '@/types';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);

  const load = () => {
    fetch('/api/admin/questions').then(r => r.json()).then(d => setQuestions(d.questions));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This will also delete all attempts for this question.`)) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    load();
  };

  const difficultyColor = (d: string) =>
    d === 'easy' ? 'text-green-400' : d === 'medium' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Questions</h1>
        <Link href="/admin/questions/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
            + Add Question
          </button>
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Title</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Difficulty</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Attempts</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Correct</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}>
                <td className="text-white px-6 py-4">{q.title}</td>
                <td className={`px-6 py-4 font-medium capitalize ${difficultyColor(q.difficulty)}`}>{q.difficulty}</td>
                <td className="text-gray-300 px-6 py-4">{q.attempt_count}</td>
                <td className="text-gray-300 px-6 py-4">{q.correct_count ?? 0}</td>
                <td className="px-6 py-4 flex gap-3">
                  <Link href={`/admin/questions/${q.id}/edit`} className="text-blue-400 hover:text-blue-300 text-sm">Edit</Link>
                  <button onClick={() => handleDelete(q.id, q.title)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
