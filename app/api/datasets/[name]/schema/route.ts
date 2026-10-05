import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');

export interface SchemaTable {
  name: string;
  columns: { name: string; type: string }[];
}

// Keyed by dataset name; invalidated when the file's mtime changes (e.g. re-upload)
const cache = new Map<string, { mtimeMs: number; tables: SchemaTable[] }>();

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  if (!/^[a-z0-9_]+$/.test(params.name)) {
    return NextResponse.json({ error: 'Invalid dataset name' }, { status: 400 });
  }

  const filepath = path.join(DATASETS_DIR, `${params.name}.db`);
  let mtimeMs: number;
  try {
    mtimeMs = fs.statSync(filepath).mtimeMs;
  } catch {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const cached = cache.get(params.name);
  if (cached && cached.mtimeMs === mtimeMs) {
    return NextResponse.json({ tables: cached.tables });
  }

  // Read-only: only table and column names/types are exposed, never data
  const db = new Database(filepath, { readonly: true, fileMustExist: true });
  try {
    const tableNames = db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[];

    const tables: SchemaTable[] = tableNames.map(({ name }) => ({
      name,
      columns: (db.prepare('SELECT name, type FROM pragma_table_info(?) ORDER BY cid').all(name) as { name: string; type: string }[])
        .map((c) => ({ name: c.name, type: c.type })),
    }));

    cache.set(params.name, { mtimeMs, tables });
    return NextResponse.json({ tables });
  } finally {
    db.close();
  }
}
