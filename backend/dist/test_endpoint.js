"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./supabase");
async function testEndpoint() {
    const college_id = "afc5771d-2918-458a-ab4c-50aca90cbd76";
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('students')
            .select('*, teams:teams!students_team_id_fkey(id, name, leader_id)')
            .eq('college_id', college_id)
            .order('created_at', { ascending: true });
        if (error) {
            console.error("Supabase Error:", error);
        }
        else {
            console.log("Supabase raw returned data:", JSON.stringify(data, null, 2));
            const withTeams = (data || []).map((s) => ({
                ...s,
                team: s.teams ? {
                    id: s.teams.id,
                    name: s.teams.name,
                    leaderId: s.teams.leader_id
                } : null
            }));
            console.log("Processed withTeams:", JSON.stringify(withTeams, null, 2));
        }
    }
    catch (e) {
        console.error("Caught exception:", e);
    }
}
testEndpoint().catch(err => console.error(err));
