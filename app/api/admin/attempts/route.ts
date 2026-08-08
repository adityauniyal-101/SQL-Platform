import { NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';

export async function GET() {
  const db = getAppDb();
  const attempts = db.prepare(`
    SELECT
      a.*,
      q.title as question_title
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    ORDER BY a.executed_at DESC
    LIMIT 100
  `).all();

  return NextResponse.json({ attempts });
}
