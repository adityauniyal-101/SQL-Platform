'use client';

// Replaces the root layout when the layout itself crashes, so it must render <html>/<body>
// and can't rely on Tailwind having loaded.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#030712', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#9ca3af' }}>The site hit an unexpected error. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
