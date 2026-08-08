import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { executeAndGrade } from '@/lib/executor';
import { compareResults } from '@/lib/comparator';
import { z } from 'zod';

const SubmitSchema = z.object({
  submission_id: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const db = getAppDb();

  const submission = db.prepare(`
    SELECT * FROM assessment_submissions WHERE id = ? AND is_submitted = 0
  `).get(parsed.data.submission_id) as { id: number; assessment_id: number } | undefined;

  if (!submission) return NextResponse.json({ error: 'Already submitted or not found' }, { status: 404 });

  const questions = db.prepare(`
    SELECT q.*, aq.order_index
    FROM questions q
    JOIN assessment_questions aq ON q.id = aq.question_id
    WHERE aq.assessment_id = ?
  `).all(submission.assessment_id) as { id: number; dataset_name: string; solution_sql: string; order_matters: number }[];

  const answers = db.prepare(`
    SELECT * FROM assessment_answers WHERE submission_id = ?
  `).all(parsed.data.submission_id) as { question_id: number; submitted_sql: string | null }[];

  let score = 0;
  const total = questions.length;

  const updateAnswer = db.prepare(`
    INSERT OR REPLACE INTO assessment_answers (submission_id, question_id, submitted_sql, is_correct, executed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const gradeAll = db.transaction(() => {
    for (const question of questions) {
      const answer = answers.find(a => a.question_id === question.id);
      const sql = answer?.submitted_sql;

      if (!sql) {
        updateAnswer.run(parsed.data.submission_id, question.id, null, 0);
        continue;
      }

      const result = executeAndGrade(question.dataset_name, sql, question.solution_sql);
      const isCorrect = result.error === null && compareResults(result.student, result.solution, question.order_matters === 1);
      if (isCorrect) score++;
      updateAnswer.run(parsed.data.submission_id, question.id, sql, isCorrect ? 1 : 0);
    }

    db.prepare(`
      UPDATE assessment_submissions
      SET is_submitted = 1, submitted_at = CURRENT_TIMESTAMP, score = ?, total = ?
      WHERE id = ?
    `).run(score, total, parsed.data.submission_id);
  });

  gradeAll();

  return NextResponse.json({ success: true, score, total });
}
