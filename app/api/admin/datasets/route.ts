import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');

export async function GET() {
  const db = getAppDb();
  const datasets = db.prepare('SELECT * FROM datasets ORDER BY created_at DESC').all();
  return NextResponse.json({ datasets });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const displayName = formData.get('display_name') as string;

  if (!file || !displayName) {
    return NextResponse.json({ error: 'File and display name are required' }, { status: 400 });
  }

  if (!file.name.endsWith('.db')) {
    return NextResponse.json({ error: 'Only .db files are allowed' }, { status: 400 });
  }

  // Generate a safe name from display name
  const safeName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const filename = `${safeName}.db`;
  const filepath = path.join(DATASETS_DIR, filename);

  // Save file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  // Inspect the database to get table names
  let tableSummary = '';
  try {
    const uploadedDb = new Database(filepath, { readonly: true });
    const tables = uploadedDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    tableSummary = tables.map(t => t.name).join(', ');
    uploadedDb.close();
  } catch {
    fs.unlinkSync(filepath);
    return NextResponse.json({ error: 'Invalid SQLite database file' }, { status: 400 });
  }

  // Save to datasets table
  const appDb = getAppDb();
  try {
    appDb.prepare(`
      INSERT INTO datasets (name, display_name, filename, table_summary)
      VALUES (?, ?, ?, ?)
    `).run(safeName, displayName, filename, tableSummary);
  } catch {
    fs.unlinkSync(filepath);
    return NextResponse.json({ error: 'Dataset name already exists' }, { status: 400 });
  }

  return NextResponse.json({ success: true, name: safeName, table_summary: tableSummary }, { status: 201 });
}
