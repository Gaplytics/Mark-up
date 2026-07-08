import { supabaseAdmin } from "./src/supabase";

async function addSlot() {
  const { data, error } = await supabaseAdmin.from("slots").insert([
    { id: 'S9', label: '2:00 PM – 3:00 PM', capacity: 30 }
  ]);
  
  if (error) {
    console.error("Error inserting slot:", error);
  } else {
    console.log("Successfully inserted slot 2pm to 3pm");
  }
}
addSlot();
