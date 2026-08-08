'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinAssessment() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return setError('Please enter your name and access code');
    setLoading(true);
    setError('');

    const res = await fetch('/api/assessment/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: code.trim(), student_name: name.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Invalid access code');
      setLoading(false);
      return;
    }

    const data = await res.json();
    // Store session in localStorage
    localStorage.setItem('assessment_session', JSON.stringify({
      submission_id: data.submission_id,
      assessment_title: data.assessment_title,
      time_limit_mins: data.time_limit_mins,
      questions: data.questions,
      started_at: Date.now(),
    }));

    router.push('/assessment/take');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Join Assessment</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your details to begin</p>

        <div className="space-y-4">
          <input
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <input
            placeholder="Access code (e.g. SQL-ABC123)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 font-mono focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Joining...' : 'Start Assessment →'}
          </button>
        </div>
      </div>
    </div>
  );
}
