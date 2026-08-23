import { createClient, type Client, type InArgs } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.RENDER
  ? '/opt/render/project/src/data'
  : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'app.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export interface RunResult {
  lastInsertRowid: number;
  changes: number;
}

export interface AppTransaction {
  execute(sql: string, params?: InArgs): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): void;
}

export interface AppDb {
  get(sql: string, params?: InArgs): Promise<Record<string, unknown> | undefined>;
  all(sql: string, params?: InArgs): Promise<Record<string, unknown>[]>;
  run(sql: string, params?: InArgs): Promise<RunResult>;
  batch(statements: { sql: string; args?: InArgs }[]): Promise<void>;
  transaction(): Promise<AppTransaction>;
}

function rowToObject(row: ArrayLike<unknown>, columns: string[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
  return obj;
}

async function all(sql: string, params: InArgs = []): Promise<Record<string, unknown>[]> {
  const result = await client.execute({ sql, args: params });
  return result.rows.map((row) => rowToObject(row, result.columns));
}

async function get(sql: string, params: InArgs = []): Promise<Record<string, unknown> | undefined> {
  return (await all(sql, params))[0];
}

async function run(sql: string, params: InArgs = []): Promise<RunResult> {
  const result = await client.execute({ sql, args: params });
  return { lastInsertRowid: Number(result.lastInsertRowid ?? 0), changes: result.rowsAffected };
}

async function batch(statements: { sql: string; args?: InArgs }[]): Promise<void> {
  await client.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    'write'
  );
}

async function transaction(): Promise<AppTransaction> {
  const tx = await client.transaction('write');
  return {
    execute: async (sql, params = []) => {
      await tx.execute({ sql, args: params });
    },
    commit: () => tx.commit(),
    rollback: () => tx.rollback(),
    close: () => tx.close(),
  };
}

const appDb: AppDb = { get, all, run, batch, transaction };

let _initPromise: Promise<void> | null = null;

export async function getAppDb(): Promise<AppDb> {
  if (!_initPromise) _initPromise = init();
  await _initPromise;
  return appDb;
}

async function init(): Promise<void> {
  await initSchema();
  await autoSeed();
}

async function initSchema(): Promise<void> {
  await client.executeMultiple(`
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

    CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      table_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    INSERT OR IGNORE INTO datasets (name, display_name, filename, table_summary)
    VALUES ('ecommerce', 'E-Commerce Demo', 'ecommerce.db', 'customers, products, orders, order_items')
  `);
}

function datasetsDir(): string {
  return process.env.RENDER
    ? '/opt/render/project/src/data/datasets'
    : path.join(process.cwd(), 'data', 'datasets');
}

// Dataset .db files are per-dataset grading targets, opened readonly by lib/executor.ts.
// They stay on local better-sqlite3 regardless of the app.db backend.
function seedEcommerceDataset(force: boolean): void {
  const dir = datasetsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const datasetPath = path.join(dir, 'ecommerce.db');
  if (!force && fs.existsSync(datasetPath)) return;

  const datasetDb = new Database(datasetPath);
  datasetDb.exec(`
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS customers;

    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      city TEXT NOT NULL,
      created_at DATE NOT NULL
    );

    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      order_date DATE NOT NULL,
      status TEXT CHECK(status IN ('pending','shipped','delivered','cancelled')) NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    INSERT INTO customers VALUES
      (1,'Alice Johnson','alice@email.com','Mumbai','2023-01-15'),
      (2,'Bob Smith','bob@email.com','Delhi','2023-02-20'),
      (3,'Carol White','carol@email.com','Bengaluru','2023-03-10'),
      (4,'David Brown','david@email.com','Chennai','2023-04-05'),
      (5,'Eva Green','eva@email.com','Mumbai','2023-05-12'),
      (6,'Frank Lee','frank@email.com','Pune','2023-06-18'),
      (7,'Grace Kim','grace@email.com','Hyderabad','2023-07-22'),
      (8,'Henry Adams','henry@email.com','Delhi','2023-08-30');

    INSERT INTO products VALUES
      (1,'Laptop Pro 15','Electronics',75000,50),
      (2,'Wireless Mouse','Electronics',1500,200),
      (3,'USB-C Hub','Electronics',3500,150),
      (4,'Desk Lamp','Furniture',2200,80),
      (5,'Office Chair','Furniture',18000,30),
      (6,'Notebook Set','Stationery',450,500),
      (7,'Mechanical Keyboard','Electronics',8500,75),
      (8,'Monitor 27"','Electronics',32000,40);

    INSERT INTO orders VALUES
      (1,1,'2024-01-10','delivered'),
      (2,2,'2024-01-15','delivered'),
      (3,1,'2024-02-05','shipped'),
      (4,3,'2024-02-10','delivered'),
      (5,4,'2024-02-20','cancelled'),
      (6,5,'2024-03-01','delivered'),
      (7,6,'2024-03-15','pending'),
      (8,2,'2024-03-20','delivered'),
      (9,7,'2024-04-01','shipped'),
      (10,8,'2024-04-10','delivered');

    INSERT INTO order_items VALUES
      (1,1,1,1,75000),(2,1,2,2,1500),
      (3,2,7,1,8500),(4,2,3,1,3500),
      (5,3,8,1,32000),
      (6,4,4,2,2200),(7,4,6,3,450),
      (8,5,5,1,18000),
      (9,6,1,1,75000),(10,6,2,1,1500),
      (11,7,3,2,3500),(12,7,6,5,450),
      (13,8,7,1,8500),(14,8,4,1,2200),
      (15,9,8,1,32000),
      (16,10,2,3,1500),(17,10,3,1,3500);
  `);
  datasetDb.close();
}

const DEFAULT_QUESTIONS = [
  { title: 'List All Customers', description: 'Write a query to retrieve the name and email of all customers, ordered by name alphabetically.\n\n**Tables:** customers(id, name, email, city, created_at)', difficulty: 'easy', dataset_name: 'ecommerce', solution_sql: 'SELECT name, email FROM customers ORDER BY name ASC', expected_columns: JSON.stringify(['name', 'email']), order_matters: 1 },
  { title: 'Products Under ₹5,000', description: 'Find all products with a price less than 5000. Return the product name, category, and price.\n\n**Tables:** products(id, name, category, price, stock)', difficulty: 'easy', dataset_name: 'ecommerce', solution_sql: 'SELECT name, category, price FROM products WHERE price < 5000 ORDER BY price ASC', expected_columns: JSON.stringify(['name', 'category', 'price']), order_matters: 0 },
  { title: 'Count Orders by Status', description: 'Count how many orders exist for each status. Return status and count, ordered by count descending.\n\n**Tables:** orders(id, customer_id, order_date, status)', difficulty: 'easy', dataset_name: 'ecommerce', solution_sql: 'SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC', expected_columns: JSON.stringify(['status', 'count']), order_matters: 1 },
  { title: 'Customer Order History', description: 'List each customer\'s name along with the total number of orders they have placed. Include customers with zero orders. Order by total orders descending.\n\n**Tables:** customers, orders', difficulty: 'medium', dataset_name: 'ecommerce', solution_sql: 'SELECT c.name, COUNT(o.id) as total_orders FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_orders DESC', expected_columns: JSON.stringify(['name', 'total_orders']), order_matters: 1 },
  { title: 'Top Revenue Products', description: 'Calculate the total revenue generated by each product (quantity × unit_price across all order items). Return the top 5 products by revenue, showing product name and total revenue.\n\n**Tables:** products, order_items', difficulty: 'hard', dataset_name: 'ecommerce', solution_sql: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) as total_revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_revenue DESC LIMIT 5', expected_columns: JSON.stringify(['name', 'total_revenue']), order_matters: 1 },
];

const INSERT_QUESTION_SQL = `
  INSERT INTO questions (title, description, difficulty, dataset_name, solution_sql, expected_columns, order_matters)
  VALUES (@title, @description, @difficulty, @dataset_name, @solution_sql, @expected_columns, @order_matters)
`;

async function seedDefaultQuestions(): Promise<void> {
  await batch(DEFAULT_QUESTIONS.map((q) => ({ sql: INSERT_QUESTION_SQL, args: q })));
}

async function autoSeed(): Promise<void> {
  const count = await get('SELECT COUNT(*) as count FROM questions');
  if ((count?.count as number) > 0) return;

  seedEcommerceDataset(false);
  await seedDefaultQuestions();
}

/** Hard reset used by `npm run seed`: wipes and recreates demo data unconditionally. */
export async function resetAppDb(): Promise<void> {
  await getAppDb();
  seedEcommerceDataset(true);
  // Clear in FK-dependency order: assessment data references questions, so it must go first.
  await run('DELETE FROM assessment_answers');
  await run('DELETE FROM assessment_questions');
  await run('DELETE FROM assessment_submissions');
  await run('DELETE FROM assessments');
  await run('DELETE FROM attempts');
  await run('DELETE FROM questions');
  await seedDefaultQuestions();
}
