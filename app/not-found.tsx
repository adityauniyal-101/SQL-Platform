import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-blue-400">SELECT * FROM pages WHERE url = &apos;this one&apos;;</p>
        <p className="mt-2 font-mono text-sm text-gray-500">-- 0 rows returned</p>
        <h1 className="mt-6 text-5xl font-bold text-white">404</h1>
        <p className="mt-3 text-gray-400">
          We couldn&apos;t find that page. It may have moved, or the link might be mistyped.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Practice questions
          </Link>
          <Link
            href="/assessment"
            className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
          >
            Join an assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
