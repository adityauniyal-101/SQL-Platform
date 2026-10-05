import Link from 'next/link';
import { SITE } from '@/lib/site';

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
  showUpdated?: boolean;
}

export default function LegalPage({ title, children, showUpdated = true }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
          ← Back to {SITE.name}
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
        {showUpdated && <p className="mt-2 text-sm text-gray-500">Last updated: {SITE.lastUpdated}</p>}
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-gray-300">{children}</div>
      </article>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-lg font-semibold text-white">{children}</h2>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-6">{children}</ul>;
}

export function Mail() {
  return (
    <a href={`mailto:${SITE.contactEmail}`} className="text-blue-400 hover:text-blue-300">
      {SITE.contactEmail}
    </a>
  );
}
