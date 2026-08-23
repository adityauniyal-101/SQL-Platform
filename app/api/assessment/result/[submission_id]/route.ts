import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { submission_id: string } }) {
  const db = await getAppDb();
  const sid = parseInt(params.submission_id);

  const submission = await db.get(`
    SELECT * FROM assessment_submissions WHERE id = ? AND is_submitted = 1
  `, [sid]) as { id: number; assessment_id: number; student_name: string; score: number; total: number; submitted_at: string } | undefined;

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const assessment = await db.get(`SELECT title FROM assessments WHERE id = ?`, [submission.assessment_id]) as { title: string };

  const answers = await db.all(`
    SELECT
      aa.question_id,
      aa.submitted_sql,
      aa.is_correct,
      q.title as question_title,
      q.difficulty
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.submission_id = ?
    ORDER BY q.id ASC
  `, [sid]);

  return NextResponse.json({ submission, assessment, answers });
}
