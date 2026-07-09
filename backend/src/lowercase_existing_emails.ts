import { supabaseAdmin } from "./supabase";

async function main() {
  console.log("Fetching all students...");
  const { data: students, error } = await supabaseAdmin
    .from("students")
    .select("id, email");

  if (error) {
    console.error("Error fetching students from database:", error);
    return;
  }

  if (!students || students.length === 0) {
    console.log("No students found in the database.");
    return;
  }

  console.log(`Found ${students.length} students. Checking for uppercase/mixed-case emails...`);
  
  let updatedCount = 0;
  for (const student of students) {
    const originalEmail = student.email;
    if (!originalEmail) continue;
    
    const lowerEmail = originalEmail.trim().toLowerCase();
    
    if (originalEmail !== lowerEmail) {
      console.log(`Updating student ${student.id}: "${originalEmail}" -> "${lowerEmail}"`);
      const { error: updateError } = await supabaseAdmin
        .from("students")
        .update({ email: lowerEmail })
        .eq("id", student.id);
        
      if (updateError) {
        console.error(`Failed to update student ${student.id} to lowercase email:`, updateError.message);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Migration finished. Total student email records updated to lowercase: ${updatedCount}`);
}

main().catch(err => {
  console.error("Script execution failed:", err);
});
