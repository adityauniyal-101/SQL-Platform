'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/site';

// Hidden on admin pages and during a timed assessment, where it would only be a distraction.
const HIDDEN_PREFIXES = ['/admin', '/assessment/take'];

export default function SiteFooter() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-6 py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 text-xs text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} {SITE.name}</p>
        <nav className="flex gap-5">
          <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
