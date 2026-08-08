import { ExecutionResult } from './executor';

export function compareResults(
  student: ExecutionResult,
  solution: ExecutionResult,
  orderMatters: boolean
): boolean {
  // Column check: same names, same order
  if (student.columns.length !== solution.columns.length) return false;
  const colMatch = student.columns.every((col, i) =>
    col.toLowerCase() === solution.columns[i].toLowerCase()
  );
  if (!colMatch) return false;

  // Row count check
  if (student.rows.length !== solution.rows.length) return false;

  // Normalize rows for comparison
  const normalize = (rows: Record<string, unknown>[]) =>
    rows.map(row =>
      student.columns.map(col => normalizeValue(row[col])).join('|||')
    );

  const studentNorm = normalize(student.rows);
  const solutionNorm = normalize(solution.rows);

  if (!orderMatters) {
    studentNorm.sort();
    solutionNorm.sort();
  }

  return studentNorm.every((row, i) => row === solutionNorm[i]);
}

function normalizeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    // Normalize floats to 6 decimal places to avoid precision issues
    return Number.isInteger(val) ? String(val) : val.toFixed(6);
  }
  return String(val).trim();
}
