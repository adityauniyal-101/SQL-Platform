'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditQuestion({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'easy',
    dataset_name: 'ecommerce', solution_sql: '', order_matters: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/questions').then(r => r.json()).then(d => {
      const q = d.questions.find((q: { id: number }) => q.id === parseInt(params.id));
      if (q) setForm({
        title: q.title, description: q.description, difficulty: q.difficulty,
        dataset_name: q.dataset_name, solution_sql: q.solution_sql,
        order_matters: q.order_matters === 1,
      });
    });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/questions/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    router.push('/admin/questions');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">Edit Question</h1>
      <div className="space-y-5">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Title</label>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            rows={4} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Solution SQL</label>
          <textarea value={form.solution_sql} onChange={e => setForm({...form, solution_sql: e.target.value})}
            rows={5} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={form.order_matters}
            onChange={e => setForm({...form, order_matters: e.target.checked})} className="w-4 h-4" />
          <label className="text-gray-400 text-sm">Order matters</label>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Update Question'}
          </button>
          <button onClick={() => router.push('/admin/questions')}
            className="text-gray-400 hover:text-white px-6 py-3 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
