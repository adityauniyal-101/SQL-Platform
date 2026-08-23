import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { z } from 'zod';

const QuestionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  dataset_name: z.string().min(1),
  solution_sql: z.string().min(1),
  order_matters: z.boolean().default(false),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = QuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const db = await getAppDb();
  await db.run(`
    UPDATE questions
    SET title=@title, description=@description, difficulty=@difficulty,
        dataset_name=@dataset_name, solution_sql=@solution_sql, order_matters=@order_matters
    WHERE id=@id
  `, {
    ...parsed.data,
    order_matters: parsed.data.order_matters ? 1 : 0,
    id: parseInt(params.id),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getAppDb();
  await db.run('DELETE FROM attempts WHERE question_id = ?', [parseInt(params.id)]);
  await db.run('DELETE FROM questions WHERE id = ?', [parseInt(params.id)]);
  return NextResponse.json({ success: true });
}
