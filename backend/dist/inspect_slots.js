"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./supabase");
async function inspectSlots() {
    const { data: slots, error } = await supabase_1.supabaseAdmin.from("slots").select("*");
    if (error) {
        console.error("Slots query error:", error);
    }
    else {
        console.log("SLOTS IN DATABASE:", slots);
    }
}
inspectSlots().catch(err => console.error(err));
