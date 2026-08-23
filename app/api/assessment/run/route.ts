import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { executeAndGrade } from '@/lib/executor';
import { z } from 'zod';

const RunSchema = z.object({
  submission_id: z.number().int().positive(),
  question_id: z.number().int().positive(),
  sql: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RunSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const db = await getAppDb();

  const submission = await db.get(`
    SELECT * FROM assessment_submissions WHERE id = ? AND is_submitted = 0
  `, [parsed.data.submission_id]) as { id: number; assessment_id: number } | undefined;

  if (!submission) return NextResponse.json({ error: 'Submission not found or already submitted' }, { status: 404 });

  const question = await db.get(`
    SELECT q.* FROM questions q
    JOIN assessment_questions aq ON q.id = aq.question_id
    WHERE q.id = ? AND aq.assessment_id = ?
  `, [parsed.data.question_id, submission.assessment_id]) as { dataset_name: string; solution_sql: string } | undefined;

  if (!question) return NextResponse.json({ error: 'Question not in this assessment' }, { status: 404 });

  const result = executeAndGrade(question.dataset_name, parsed.data.sql, question.solution_sql);

  if (result.error !== null) {
    return NextResponse.json({ success: false, error: result.error });
  }

  // Save/update the answer (last run before submit)
  const existing = await db.get(`
    SELECT id FROM assessment_answers WHERE submission_id = ? AND question_id = ?
  `, [parsed.data.submission_id, parsed.data.question_id]);

  if (existing) {
    await db.run(`
      UPDATE assessment_answers SET submitted_sql = ?, executed_at = CURRENT_TIMESTAMP WHERE submission_id = ? AND question_id = ?
    `, [parsed.data.sql, parsed.data.submission_id, parsed.data.question_id]);
  } else {
    await db.run(`
      INSERT INTO assessment_answers (submission_id, question_id, submitted_sql, executed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [parsed.data.submission_id, parsed.data.question_id, parsed.data.sql]);
  }

  // Return result rows but NOT correct/incorrect
  return NextResponse.json({
    success: true,
    student_result: result.student.rows,
    student_columns: result.student.columns,
  });
}
