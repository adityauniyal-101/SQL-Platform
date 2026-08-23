import { NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getAppDb();
  const attempts = await db.all(`
    SELECT
      a.*,
      q.title as question_title
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    ORDER BY a.executed_at DESC
    LIMIT 100
  `);

  return NextResponse.json({ attempts });
}
