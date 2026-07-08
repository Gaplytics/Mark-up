import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase env variables are missing in backend!");
}

// Admin client using Service Role Key (secure, runs only on backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
