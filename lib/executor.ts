import { spawn } from 'child_process';
import path from 'path';

const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');
const MAX_ROWS = 500;
const QUERY_TIMEOUT_MS = 5000;
const MAX_CONCURRENT = 3;
const MAX_QUEUED = 20;

export interface ExecutionResult {
  rows: Record<string, unknown>[];
  columns: string[];
}

export interface GradeResult {
  student: ExecutionResult;
  solution: ExecutionResult;
  error: null;
}

export interface GradeError {
  error: string;
}

// Runs inside a short-lived child process. better-sqlite3 is synchronous and cannot be
// interrupted, so a runaway query (e.g. infinite recursive CTE) can only be stopped by
// killing the process it runs in. Reads { dbPath, studentSql, solutionSql, maxRows } from
// stdin and writes a GradeResult | GradeError as JSON to stdout.
const WORKER_SRC = `
const Database = require('better-sqlite3');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  const { dbPath, studentSql, solutionSql, maxRows } = JSON.parse(input);
  const out = (o) => process.stdout.write(JSON.stringify(o));
  const runQuery = (db, sql) => {
    const rows = [];
    for (const row of db.prepare(sql).iterate()) {
      if (rows.length >= maxRows) break;
      rows.push(row);
    }
    return { rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] };
  };

  // Open in readonly mode to prevent any destructive operations
  let db;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  } catch {
    return out({ error: 'DATASET_NOT_FOUND' });
  }

  try {
    let student;
    try {
      student = runQuery(db, studentSql);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown SQL error';
      if (message.includes('does not return data')) {
        return out({ error: 'Only read queries (SELECT or WITH ... SELECT) are allowed here. The datasets are read-only.' });
      }
      return out({ error: message });
    }
    // Errors here are a platform bug, not student error
    let solution;
    try {
      solution = runQuery(db, solutionSql);
    } catch (err) {
      return out({ error: 'PLATFORM_ERROR', detail: err instanceof Error ? err.message : String(err) });
    }
    out({ student, solution, error: null });
  } finally {
    db.close();
  }
});
`;

// ---------- Concurrency limiter ----------

let running = 0;
const queue: (() => void)[] = [];

function acquireSlot(): Promise<boolean> {
  if (running < MAX_CONCURRENT) {
    running++;
    return Promise.resolve(true);
  }
  if (queue.length >= MAX_QUEUED) return Promise.resolve(false);
  return new Promise((resolve) => queue.push(() => resolve(true)));
}

function releaseSlot() {
  const next = queue.shift();
  if (next) next(); // hand the slot straight to the next waiter
  else running--;
}

function runInChild(input: object): Promise<GradeResult | GradeError> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--max-old-space-size=128', '-e', WORKER_SRC], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (result: GradeResult | GradeError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish({
        error: `Query took too long (${QUERY_TIMEOUT_MS / 1000}s limit). Check for infinite recursion or very large joins.`,
      });
    }, QUERY_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (c: string) => { stdout += c; });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (c: string) => { stderr += c; });
    child.on('error', (err) => {
      console.error('Query worker failed to start:', err);
      finish({ error: 'Could not run your query right now. Please try again.' });
    });
    child.on('close', () => {
      if (settled) return;
      try {
        finish(JSON.parse(stdout));
      } catch {
        // Typically the 128MB memory cap was hit
        console.error('Query worker exited without a result:', stderr.slice(0, 2000));
        finish({ error: 'Query used too much memory or crashed. Try narrowing it down (e.g. add filters).' });
      }
    });

    child.stdin.end(JSON.stringify(input));
  });
}

export async function executeAndGrade(
  datasetName: string,
  studentSql: string,
  solutionSql: string
): Promise<GradeResult | GradeError> {
  const dbPath = path.join(DATASETS_DIR, `${datasetName}.db`);

  if (!(await acquireSlot())) {
    return { error: 'Server is busy right now. Please try again in a few seconds.' };
  }

  let result: GradeResult | GradeError & { detail?: string };
  try {
    result = await runInChild({ dbPath, studentSql, solutionSql, maxRows: MAX_ROWS });
  } finally {
    releaseSlot();
  }

  if (result.error === 'DATASET_NOT_FOUND') {
    return { error: `Dataset "${datasetName}" not found.` };
  }
  if (result.error === 'PLATFORM_ERROR') {
    // Solution SQL failed — log server-side, never echo solution details to the client
    console.error(`Solution SQL failed on dataset "${datasetName}":`, 'detail' in result ? result.detail : '');
    return { error: 'This question has a configuration problem. Please report it to your instructor.' };
  }
  return result;
}
