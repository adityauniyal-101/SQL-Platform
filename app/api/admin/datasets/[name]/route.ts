import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');

export async function DELETE(_req: NextRequest, { params }: { params: { name: string } }) {
  if (params.name === 'ecommerce') {
    return NextResponse.json({ error: 'Cannot delete the default dataset' }, { status: 400 });
  }

  const db = getAppDb();

  // Check if any questions use this dataset
  const inUse = db.prepare('SELECT COUNT(*) as count FROM questions WHERE dataset_name = ?').get(params.name) as { count: number };
  if (inUse.count > 0) {
    return NextResponse.json({ error: `Cannot delete — ${inUse.count} question(s) use this dataset` }, { status: 400 });
  }

  // Delete from DB
  db.prepare('DELETE FROM datasets WHERE name = ?').run(params.name);

  // Delete file
  const filepath = path.join(DATASETS_DIR, `${params.name}.db`);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

  return NextResponse.json({ success: true });
}
