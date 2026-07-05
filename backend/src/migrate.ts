import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./supabase";

async function runMigration() {
  const jsonPath = path.join(__dirname, "teams.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("No teams.json found at:", jsonPath);
    return;
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: Record<string, string> = JSON.parse(raw);

  // Group student IDs by team/group name
  const teamGroups: Record<string, string[]> = {};
  for (const [studentId, teamName] of Object.entries(data)) {
    if (!teamGroups[teamName]) {
      teamGroups[teamName] = [];
    }
    teamGroups[teamName].push(studentId);
  }

  console.log(`Found ${Object.keys(teamGroups).length} teams to migrate from teams.json...`);

  for (const [teamName, studentIds] of Object.entries(teamGroups)) {
    console.log(`Migrating "${teamName}" with ${studentIds.length} members...`);

    // Find the college_id of the first student to set for the team
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("students")
      .select("college_id")
      .eq("id", studentIds[0])
      .maybeSingle();

    if (studentError || !studentData) {
      console.error(`Error finding student ${studentIds[0]}:`, studentError?.message || "Student not found in database.");
      continue;
    }

    const collegeId = studentData.college_id;
    const leaderId = studentIds[0]; // Set first student as leader

    // Check if team already exists
    const { data: existingTeam } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("name", teamName)
      .eq("college_id", collegeId)
      .maybeSingle();

    let teamId: string;

    if (existingTeam) {
      console.log(`Team "${teamName}" already exists with ID: ${existingTeam.id}`);
      teamId = existingTeam.id;
    } else {
      // Insert new team
      const { data: newTeam, error: insertError } = await supabaseAdmin
        .from("teams")
        .insert({
          name: teamName,
          college_id: collegeId,
          leader_id: leaderId
        })
        .select()
        .single();

      if (insertError || !newTeam) {
        console.error(`Error inserting team "${teamName}":`, insertError?.message);
        continue;
      }

      console.log(`Created team "${teamName}" with ID: ${newTeam.id}`);
      teamId = newTeam.id;
    }

    // Update students with the team_id
    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ team_id: teamId })
      .in("id", studentIds);

    if (updateError) {
      console.error(`Error updating student team assignments:`, updateError.message);
    } else {
      console.log(`Successfully assigned ${studentIds.length} students to team "${teamName}"`);
    }
  }

  console.log("Migration complete!");
}

runMigration().catch(err => {
  console.error("Migration script failed:", err);
});
