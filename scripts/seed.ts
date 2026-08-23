import { resetAppDb } from '../lib/db';

resetAppDb()
  .then(() => {
    console.log('✅ ecommerce.db dataset created');
    console.log('✅ 5 questions seeded into app.db');
    console.log('🚀 Database ready. Run: npm run dev');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
