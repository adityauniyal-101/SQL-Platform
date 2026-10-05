import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { executeAndGrade } from '@/lib/executor';
import { compareResults } from '@/lib/comparator';
import { ASSESSMENT_COOKIE, getAssessmentSubmissionId } from '@/lib/auth';
import { z } from 'zod';

const SubmitSchema = z.object({
  submission_id: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const sessionSubmissionId = await getAssessmentSubmissionId(req.cookies.get(ASSESSMENT_COOKIE)?.value);
  if (sessionSubmissionId !== parsed.data.submission_id) {
    return NextResponse.json({ error: 'This assessment session does not belong to you' }, { status: 403 });
  }

  const db = await getAppDb();

  const submission = await db.get(`
    SELECT * FROM assessment_submissions WHERE id = ? AND is_submitted = 0
  `, [parsed.data.submission_id]) as { id: number; assessment_id: number } | undefined;

  if (!submission) return NextResponse.json({ error: 'Already submitted or not found' }, { status: 404 });

  const questions = await db.all(`
    SELECT q.*, aq.order_index
    FROM questions q
    JOIN assessment_questions aq ON q.id = aq.question_id
    WHERE aq.assessment_id = ?
  `, [submission.assessment_id]) as { id: number; dataset_name: string; solution_sql: string; order_matters: number }[];

  const answers = await db.all(`
    SELECT * FROM assessment_answers WHERE submission_id = ?
  `, [parsed.data.submission_id]) as { question_id: number; submitted_sql: string | null }[];

  // Grade everything first (each query can take up to the executor timeout),
  // so the write transaction below stays short.
  const graded: { questionId: number; sql: string | null; isCorrect: boolean }[] = [];
  for (const question of questions) {
    const sql = answers.find(a => a.question_id === question.id)?.submitted_sql ?? null;
    if (!sql) {
      graded.push({ questionId: question.id, sql: null, isCorrect: false });
      continue;
    }
    const result = await executeAndGrade(question.dataset_name, sql, question.solution_sql);
    const isCorrect = result.error === null && compareResults(result.student, result.solution, question.order_matters === 1);
    graded.push({ questionId: question.id, sql, isCorrect });
  }

  const score = graded.filter(g => g.isCorrect).length;
  const total = questions.length;

  const updateAnswerSql = `
    INSERT OR REPLACE INTO assessment_answers (submission_id, question_id, submitted_sql, is_correct, executed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  const tx = await db.transaction();
  try {
    for (const g of graded) {
      await tx.execute(updateAnswerSql, [parsed.data.submission_id, g.questionId, g.sql, g.isCorrect ? 1 : 0]);
    }

    await tx.execute(`
      UPDATE assessment_submissions
      SET is_submitted = 1, submitted_at = CURRENT_TIMESTAMP, score = ?, total = ?
      WHERE id = ?
    `, [score, total, parsed.data.submission_id]);

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }

  return NextResponse.json({ success: true, score, total });
}
