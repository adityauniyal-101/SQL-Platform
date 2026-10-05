import { ensureSeeded, resetAppDb } from '../lib/db';

// Default is SAFE (Render runs `npm run seed` on every deploy): only fills in what's missing.
// Pass --reset to wipe all questions, attempts, assessments and submissions.
const reset = process.argv.includes('--reset');

(reset ? resetAppDb() : ensureSeeded())
  .then(() => {
    if (reset) {
      console.log('⚠️  Database RESET: all app data wiped and demo questions re-seeded');
    } else {
      console.log('✅ Schema, ecommerce dataset and demo questions ensured (no data deleted)');
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
