import { NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getAppDb();

  const stats = await db.get(`
    SELECT
      (SELECT COUNT(*) FROM questions) as total_questions,
      (SELECT COUNT(*) FROM attempts) as total_attempts,
      (SELECT COUNT(*) FROM attempts WHERE is_correct = 1) as correct_attempts
  `) as { total_questions: number; total_attempts: number; correct_attempts: number };

  const hardest = await db.get(`
    SELECT q.title
    FROM questions q
    LEFT JOIN attempts a ON q.id = a.question_id
    GROUP BY q.id
    HAVING COUNT(a.id) > 0
    ORDER BY (SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(a.id)) DESC
    LIMIT 1
  `) as { title: string } | undefined;

  return NextResponse.json({
    ...stats,
    hardest_question: hardest?.title ?? null,
  });
}
