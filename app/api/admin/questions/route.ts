import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { z } from 'zod';

export async function GET() {
  const db = getAppDb();
  const questions = db.prepare(`
    SELECT
      q.*,
      COUNT(a.id) as attempt_count,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count
    FROM questions q
    LEFT JOIN attempts a ON q.id = a.question_id
    GROUP BY q.id
    ORDER BY q.id ASC
  `).all();

  return NextResponse.json({ questions });
}

const QuestionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  dataset_name: z.string().min(1),
  solution_sql: z.string().min(1),
  order_matters: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = QuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const db = getAppDb();
  const result = db.prepare(`
    INSERT INTO questions (title, description, difficulty, dataset_name, solution_sql, order_matters)
    VALUES (@title, @description, @difficulty, @dataset_name, @solution_sql, @order_matters)
  `).run({
    ...parsed.data,
    order_matters: parsed.data.order_matters ? 1 : 0,
  });

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
