import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Local/Target database credentials (from .env)
const localUrl = process.env.SUPABASE_URL || '';
const localKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Remote Staging database (where the 550 questions are)
const stagingUrl = 'http://80.225.241.81:8020';
// We can use the service role key from the staging environment if it is the same, 
// or since stagingUrl is in the original .env, process.env.SUPABASE_SERVICE_ROLE_KEY might be the staging key!
// Let's check: if process.env.SUPABASE_URL in their local .env is localhost, then they have a local key.
// But in the .env we read, SUPABASE_URL was http://80.225.241.81:8020, which is the remote staging url.
// This means the user's local backend .env is currently pointing to staging, but maybe their browser is pointing to localhost?
// Wait, if their backend is pointing to staging, why did they get fallback questions?
// Ah! If their backend is pointing to staging, why did q1Count return 550 in test_db.ts?
// Wait! In test_db.ts output:
// Connecting to: http://80.225.241.81:8020
// Fetching http://localhost:3001/api/debug-questions...
// Debug Response: { q1Count: 550, ... }
// So when the backend ran locally on port 3001, it DID connect to staging and DID get 550 questions!
// Then why is the student getting fallback questions in the browser?
// Ah!!!
// Let's look at the browser address bar in the user's error message:
// GET /jury/login 200 in 423ms
// [browser] A tree hydrated but some attributes of the server rendered HTML didn't match...
// Wait, does the browser connect to http://localhost:3000? Yes.
// But wait! Is it possible that the student's browser is requesting from a DIFFERENT backend that is running locally, but that backend has a different .env?
// Yes! If the user started their backend dev server using a different .env, or if they started it in a way that process.env.SUPABASE_URL is local (localhost:8021) instead of staging!
// Yes, in their browser, they have Supabase running on localhost:8021.
// If their backend process is pointing to localhost:8021, then the backend will query their local database, which is empty!
// So it gets 0 questions and falls back to 10 questions!
// This is exactly it!

async function seed() {
  try {
    console.log('Staging URL:', stagingUrl);
    console.log('Local/Target URL:', localUrl);

    if (localUrl === stagingUrl) {
      console.log('Your local .env is already pointing to the staging database. No need to seed.');
      return;
    }

    const stagingSupabase = createClient(stagingUrl, localKey); // using same service key assuming it is staging
    const localSupabase = createClient(localUrl, localKey);

    console.log('Fetching questions from staging...');
    const { data: questions, error: fetchErr } = await stagingSupabase
      .from('Question_bank')
      .select('*');

    if (fetchErr || !questions) {
      throw new Error('Failed to fetch from staging: ' + fetchErr?.message);
    }

    console.log(`Fetched ${questions.length} questions. Seeding to local database...`);

    // Delete existing local questions first
    await localSupabase.from('Question_bank').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize).map(q => {
        // Remove ID to let target DB generate new ones, or keep it
        const { id, ...rest } = q;
        return rest;
      });
      const { error: insertErr } = await localSupabase.from('Question_bank').insert(batch);
      if (insertErr) {
        console.error('Batch insert error:', insertErr);
      } else {
        console.log(`Inserted questions ${i + 1} to ${Math.min(i + batchSize, questions.length)}`);
      }
    }

    console.log('Seeding complete!');
  } catch (err: any) {
    console.error('Seeding failed:', err.message);
  }
}

seed();
