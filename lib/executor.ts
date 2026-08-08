import Database from 'better-sqlite3';
import path from 'path';

const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');
const MAX_ROWS = 500;
const QUERY_TIMEOUT_MS = 5000;

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

export function executeAndGrade(
  datasetName: string,
  studentSql: string,
  solutionSql: string
): GradeResult | GradeError {
  const dbPath = path.join(DATASETS_DIR, `${datasetName}.db`);

  // Open in readonly mode to prevent any destructive operations
  let db: Database.Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    return { error: `Dataset "${datasetName}" not found.` };
  }

  try {
    // Set timeout
    db.pragma(`busy_timeout = ${QUERY_TIMEOUT_MS}`);

    // Execute student SQL
    let studentRows: Record<string, unknown>[];
    let studentColumns: string[];
    try {
      const stmt = db.prepare(studentSql);
      const result = stmt.all() as Record<string, unknown>[];
      studentRows = result.slice(0, MAX_ROWS);
      studentColumns = result.length > 0 ? Object.keys(result[0]) : [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown SQL error';
      return { error: message };
    }

    // Execute solution SQL (errors here are a platform bug, not student error)
    const solutionStmt = db.prepare(solutionSql);
    const solutionResult = solutionStmt.all() as Record<string, unknown>[];
    const solutionRows = solutionResult.slice(0, MAX_ROWS);
    const solutionColumns = solutionResult.length > 0 ? Object.keys(solutionResult[0]) : [];

    return {
      student: { rows: studentRows, columns: studentColumns },
      solution: { rows: solutionRows, columns: solutionColumns },
      error: null,
    };
  } finally {
    db.close();
  }
}
