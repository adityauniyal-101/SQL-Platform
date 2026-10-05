'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
        <p className="mt-3 text-gray-400">
          An unexpected error happened on our side. Your work in other tabs is not affected. Please try again.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-gray-600">Error reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
