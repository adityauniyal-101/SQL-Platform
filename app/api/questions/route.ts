import { NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import { Question } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getAppDb();
    // Do NOT return solution_sql to the client
    const questions = await db.all(`
      SELECT id, title, description, difficulty, dataset_name, expected_columns, order_matters, created_at
      FROM questions
      ORDER BY difficulty ASC, id ASC
    `) as Omit<Question, 'solution_sql'>[];

    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
