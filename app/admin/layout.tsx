'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-lg">SQL Platform — Admin</span>
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">Dashboard</Link>
          <Link href="/admin/questions" className="text-gray-400 hover:text-white text-sm transition-colors">Questions</Link>
          <Link href="/admin/attempts" className="text-gray-400 hover:text-white text-sm transition-colors">Attempts</Link>
          <Link href="/admin/assessments" className="text-gray-400 hover:text-white text-sm transition-colors">Assessments</Link>
          <Link href="/admin/datasets" className="text-gray-400 hover:text-white text-sm transition-colors">Datasets</Link>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Student View</Link>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors">
          Logout
        </button>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
}
