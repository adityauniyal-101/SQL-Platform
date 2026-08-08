'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  title: string;
  difficulty: string;
}

export default function NewAssessment() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [timeLimitMins, setTimeLimitMins] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/questions').then(r => r.json()).then(d => setQuestions(d.questions));
  }, []);

  const toggleQuestion = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!title.trim()) return setError('Title is required');
    if (selectedIds.length === 0) return setError('Select at least one question');
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, time_limit_mins: timeLimitMins, question_ids: selectedIds }),
    });
    if (res.ok) {
      router.push('/admin/assessments');
    } else {
      setError('Failed to create assessment');
    }
    setSaving(false);
  };

  const difficultyColor = (d: string) =>
    d === 'easy' ? 'text-green-400' : d === 'medium' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">Create Assessment</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Assessment Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. SQL Mid-Term Exam"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Time Limit (minutes)</label>
          <input type="number" value={timeLimitMins} onChange={e => setTimeLimitMins(parseInt(e.target.value))}
            min={5} max={180}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-3">Select Questions ({selectedIds.length} selected)</label>
          <div className="space-y-2">
            {questions.map(q => (
              <div
                key={q.id}
                onClick={() => toggleQuestion(q.id)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedIds.includes(q.id)
                    ? 'border-blue-500 bg-blue-950'
                    : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(q.id)} readOnly className="w-4 h-4" />
                  <span className="text-white text-sm">{q.title}</span>
                </div>
                <span className={`text-xs font-medium capitalize ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            {saving ? 'Creating...' : 'Create Assessment'}
          </button>
          <button onClick={() => router.push('/admin/assessments')}
            className="text-gray-400 hover:text-white px-6 py-3 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
