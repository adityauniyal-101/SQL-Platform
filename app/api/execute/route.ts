import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppDb } from '@/lib/db';
import { executeAndGrade } from '@/lib/executor';
import { compareResults } from '@/lib/comparator';
import { ExecuteResponse } from '@/types';

const ExecuteSchema = z.object({
  question_id: z.number().int().positive(),
  sql: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { question_id, sql } = parsed.data;
  const db = getAppDb();

  // Fetch question (including hidden solution_sql — server side only)
  const question = db.prepare(`
    SELECT id, dataset_name, solution_sql, order_matters FROM questions WHERE id = ?
  `).get(question_id) as { id: number; dataset_name: string; solution_sql: string; order_matters: number } | undefined;

  if (!question) {
    return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
  }

  const gradeResult = executeAndGrade(question.dataset_name, sql, question.solution_sql);

  // Log attempt regardless of outcome
  const isError = gradeResult.error !== null;
  const isCorrect = isError ? false : compareResults(
    gradeResult.student,
    gradeResult.solution,
    question.order_matters === 1
  );

  db.prepare(`
    INSERT INTO attempts (question_id, student_id, submitted_sql, is_correct, error_message)
    VALUES (?, 'anonymous', ?, ?, ?)
  `).run(question_id, sql, isCorrect ? 1 : 0, isError ? gradeResult.error : null);

  if (isError) {
    const response: ExecuteResponse = {
      success: false,
      error: gradeResult.error,
    };
    return NextResponse.json(response);
  }

  const response: ExecuteResponse = {
    success: true,
    is_correct: isCorrect,
    student_result: gradeResult.student.rows,
    student_columns: gradeResult.student.columns,
  };

  return NextResponse.json(response);
}
