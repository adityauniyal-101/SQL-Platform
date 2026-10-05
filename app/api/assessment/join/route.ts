import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { ASSESSMENT_COOKIE, signToken } from '@/lib/auth';
import { z } from 'zod';

const JoinSchema = z.object({
  access_code: z.string().min(1),
  student_name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
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

  const response = NextResponse.json({
    submission_id: submission.lastInsertRowid,
    assessment_title: assessment.title,
    time_limit_mins: assessment.time_limit_mins,
    questions,
  });

  // Bind this submission to this browser so other people can't run/submit/view it by guessing ids
  const ttlSecs = (assessment.time_limit_mins + 60) * 60;
  response.cookies.set(ASSESSMENT_COOKIE, await signToken(`sub${submission.lastInsertRowid}`, ttlSecs), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ttlSecs,
    path: '/',
  });
  return response;
}
