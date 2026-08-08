import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getAppDb();
  const assessment = db.prepare(`SELECT * FROM assessments WHERE id = ?`).get(parseInt(params.id));
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const questions = db.prepare(`
    SELECT aq.order_index, q.id, q.title, q.difficulty
    FROM assessment_questions aq
    JOIN questions q ON aq.question_id = q.id
    WHERE aq.assessment_id = ?
    ORDER BY aq.order_index ASC
  `).all(parseInt(params.id));

  const submissions = db.prepare(`
    SELECT
      s.*,
      COUNT(CASE WHEN a.is_correct = 1 THEN 1 END) as correct_count
    FROM assessment_submissions s
    LEFT JOIN assessment_answers a ON s.id = a.submission_id
    WHERE s.assessment_id = ? AND s.is_submitted = 1
    GROUP BY s.id
    ORDER BY s.submitted_at DESC
  `).all(parseInt(params.id)) as { id: number }[];

  const answersStmt = db.prepare(`
    SELECT
      aa.question_id,
      aa.submitted_sql,
      aa.is_correct,
      q.title as question_title
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.submission_id = ?
    ORDER BY q.id ASC
  `);

  const submissionsWithAnswers = submissions.map((s) => ({
    ...s,
    answers: answersStmt.all(s.id),
  }));

  return NextResponse.json({ assessment, questions, submissions: submissionsWithAnswers });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { is_active } = await req.json();
  const db = getAppDb();
  db.prepare(`UPDATE assessments SET is_active = ? WHERE id = ?`).run(is_active ? 1 : 0, parseInt(params.id));
  return NextResponse.json({ success: true });
}
