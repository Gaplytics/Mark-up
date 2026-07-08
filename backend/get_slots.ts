import { supabaseAdmin } from "./src/supabase";

async function run() {
  const { data: slots, error } = await supabaseAdmin.from("slots").select("*").order("id");
  if (error) {
    console.error("Error fetching slots:", error);
  } else {
    console.log("Current slots:", slots);
  }
}
run();
