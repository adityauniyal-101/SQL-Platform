import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { z } from 'zod';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SQL-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const db = getAppDb();
  const assessments = db.prepare(`
    SELECT
      a.*,
      COUNT(DISTINCT aq.id) as question_count,
      COUNT(DISTINCT s.id) as submission_count
    FROM assessments a
    LEFT JOIN assessment_questions aq ON a.id = aq.assessment_id
    LEFT JOIN assessment_submissions s ON a.id = s.assessment_id AND s.is_submitted = 1
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all();
  return NextResponse.json({ assessments });
}

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  time_limit_mins: z.number().int().min(5).max(180),
  question_ids: z.array(z.number()).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const db = getAppDb();
  const code = generateCode();

  const result = db.prepare(`
    INSERT INTO assessments (title, access_code, time_limit_mins)
    VALUES (?, ?, ?)
  `).run(parsed.data.title, code, parsed.data.time_limit_mins);

  const assessmentId = result.lastInsertRowid;
  const insertQ = db.prepare(`
    INSERT INTO assessment_questions (assessment_id, question_id, order_index)
    VALUES (?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    parsed.data.question_ids.forEach((qid, i) => {
      insertQ.run(assessmentId, qid, i);
    });
  });
  insertAll();

  return NextResponse.json({ id: assessmentId, access_code: code }, { status: 201 });
}
