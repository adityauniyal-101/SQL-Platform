import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'app.db');

let _db: Database.Database | null = null;

export function getAppDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
      dataset_name TEXT NOT NULL,
      solution_sql TEXT NOT NULL,
      expected_columns TEXT,
      order_matters INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      student_id TEXT DEFAULT 'anonymous',
      submitted_sql TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      error_message TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      access_code TEXT UNIQUE NOT NULL,
      time_limit_mins INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      is_submitted INTEGER NOT NULL DEFAULT 0,
      score INTEGER,
      total INTEGER,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      submitted_sql TEXT,
      is_correct INTEGER,
      executed_at DATETIME,
      FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      UNIQUE (submission_id, question_id)
    );
  `);
}
