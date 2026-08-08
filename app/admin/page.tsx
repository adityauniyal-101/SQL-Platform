'use client';
import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  const cards = [
    { label: 'Total Questions', value: stats?.total_questions ?? '—' },
    { label: 'Total Attempts', value: stats?.total_attempts ?? '—' },
    { label: 'Correct Attempts', value: stats?.correct_attempts ?? '—' },
    { label: 'Hardest Question', value: stats?.hardest_question ?? 'N/A' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
