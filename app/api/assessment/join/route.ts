import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { z } from 'zod';

const JoinSchema = z.object({
  access_code: z.string().min(1),
  student_name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const db = await getAppDb();
  const assessment = await db.get(`
    SELECT * FROM assessments WHERE access_code = ? AND is_active = 1
  `, [parsed.data.access_code.toUpperCase()]) as { id: number; title: string; time_limit_mins: number } | undefined;

  if (!assessment) return NextResponse.json({ error: 'Invalid or inactive access code' }, { status: 404 });

  const submission = await db.run(`
    INSERT INTO assessment_submissions (assessment_id, student_name)
    VALUES (?, ?)
  `, [assessment.id, parsed.data.student_name]);

  const questions = await db.all(`
    SELECT aq.order_index, q.id, q.title, q.description, q.difficulty, q.dataset_name
    FROM assessment_questions aq
    JOIN questions q ON aq.question_id = q.id
    WHERE aq.assessment_id = ?
    ORDER BY aq.order_index ASC
  `, [assessment.id]);

  return NextResponse.json({
    submission_id: submission.lastInsertRowid,
    assessment_title: assessment.title,
    time_limit_mins: assessment.time_limit_mins,
    questions,
  });
}
