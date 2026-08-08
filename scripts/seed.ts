import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Setup dataset
const DATASETS_DIR = process.env.RENDER
  ? '/opt/render/project/src/data/datasets'
  : path.join(process.cwd(), 'data', 'datasets');
if (!fs.existsSync(DATASETS_DIR)) fs.mkdirSync(DATASETS_DIR, { recursive: true });

const datasetDb = new Database(path.join(DATASETS_DIR, 'ecommerce.db'));

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
console.log('✅ ecommerce.db dataset created');

// Seed questions into app DB
const DATA_DIR = process.env.RENDER
  ? '/opt/render/project/src/data'
  : path.join(process.cwd(), 'data');
const appDb = new Database(path.join(DATA_DIR, 'app.db'));

appDb.pragma('foreign_keys = ON');
appDb.exec(`
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
`);

appDb.prepare('DELETE FROM attempts').run();
appDb.prepare('DELETE FROM questions').run();

const questions = [
  {
    title: 'List All Customers',
    description: 'Write a query to retrieve the name and email of all customers, ordered by name alphabetically.\n\n**Tables:** customers(id, name, email, city, created_at)',
    difficulty: 'easy',
    dataset_name: 'ecommerce',
    solution_sql: 'SELECT name, email FROM customers ORDER BY name ASC',
    expected_columns: JSON.stringify(['name', 'email']),
    order_matters: 1,
  },
  {
    title: 'Products Under ₹5,000',
    description: 'Find all products with a price less than 5000. Return the product name, category, and price.\n\n**Tables:** products(id, name, category, price, stock)',
    difficulty: 'easy',
    dataset_name: 'ecommerce',
    solution_sql: "SELECT name, category, price FROM products WHERE price < 5000 ORDER BY price ASC",
    expected_columns: JSON.stringify(['name', 'category', 'price']),
    order_matters: 0,
  },
  {
    title: 'Count Orders by Status',
    description: 'Count how many orders exist for each status. Return status and count, ordered by count descending.\n\n**Tables:** orders(id, customer_id, order_date, status)',
    difficulty: 'easy',
    dataset_name: 'ecommerce',
    solution_sql: 'SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC',
    expected_columns: JSON.stringify(['status', 'count']),
    order_matters: 1,
  },
  {
    title: 'Customer Order History',
    description: 'List each customer\'s name along with the total number of orders they have placed. Include customers with zero orders. Order by total orders descending.\n\n**Tables:** customers, orders',
    difficulty: 'medium',
    dataset_name: 'ecommerce',
    solution_sql: 'SELECT c.name, COUNT(o.id) as total_orders FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_orders DESC',
    expected_columns: JSON.stringify(['name', 'total_orders']),
    order_matters: 1,
  },
  {
    title: 'Top Revenue Products',
    description: 'Calculate the total revenue generated by each product (quantity × unit_price across all order items). Return the top 5 products by revenue, showing product name and total revenue.\n\n**Tables:** products, order_items',
    difficulty: 'hard',
    dataset_name: 'ecommerce',
    solution_sql: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) as total_revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_revenue DESC LIMIT 5',
    expected_columns: JSON.stringify(['name', 'total_revenue']),
    order_matters: 1,
  },
];

const insert = appDb.prepare(`
  INSERT INTO questions (title, description, difficulty, dataset_name, solution_sql, expected_columns, order_matters)
  VALUES (@title, @description, @difficulty, @dataset_name, @solution_sql, @expected_columns, @order_matters)
`);

const insertMany = appDb.transaction((qs: typeof questions) => {
  for (const q of qs) insert.run(q);
});

insertMany(questions);
appDb.close();

console.log('✅ 5 questions seeded into app.db');
console.log('🚀 Database ready. Run: npm run dev');
