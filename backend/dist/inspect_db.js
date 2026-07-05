"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./supabase");
async function inspect() {
    const { data: colleges, error: colError } = await supabase_1.supabaseAdmin.from("colleges").select("*");
    if (colError) {
        console.error("Colleges query error:", colError);
    }
    else {
        console.log("COLLEGES IN DB:", colleges);
    }
    const { data: students, error: studError } = await supabase_1.supabaseAdmin.from("students").select("*");
    if (studError) {
        console.error("Students query error:", studError);
    }
    else {
        console.log(`STUDENTS IN DB (${students?.length || 0} total):`);
        students?.forEach(s => {
            console.log(`- ID: ${s.id}, Name: ${s.name}, CollegeID: ${s.college_id}`);
        });
    }
}
inspect().catch(err => console.error(err));
