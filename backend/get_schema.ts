import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getSchema() {
  const tables = ['colleges', 'students', 'judges', 'slots'];
  const schema: any = {};
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
       schema[table] = { error: error.message };
    } else if (data && data.length > 0) {
       const row = data[0];
       schema[table] = {};
       for (const key of Object.keys(row)) {
          schema[table][key] = row[key] === null ? 'nullable' : (typeof row[key] === 'object' ? 'json' : typeof row[key]);
       }
    } else {
       schema[table] = "No data to infer schema.";
    }
  }
  
  fs.writeFileSync('schema_output.json', JSON.stringify(schema, null, 2));
  console.log("Schema saved to schema_output.json");
}

getSchema();
