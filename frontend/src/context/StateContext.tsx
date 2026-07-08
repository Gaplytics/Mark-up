"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// =========================================================
// TYPES & DATA STRUCTURES
// =========================================================
export interface RoundSubmission {
  status: "not-submitted" | "pending" | "approved" | "rejected";
  link: string;
  note: string;
  juryScore: number | null;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string | null;
  qualifiedR3?: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  collegeId: string;
  college: string;
  slotId: string | null;
  teamId: string | null;
  team: Team | null;
  round1Status: "not-started" | "in-progress" | "submitted";
  r1Score: number | null;
  proctoringFlagged?: boolean;
  proctoringNote?: string | null;
  round2: RoundSubmission;
  round3: RoundSubmission;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  dept: string;
  collegeId?: string;
  slotIds?: string[];
  slot_ids?: string[];
}

export interface Slot {
  id: string;
  label: string;
  capacity: number;
  filled?: number;
}

export interface Toast {
  id: number;
  msg: string;
  type?: "success" | "error";
  title?: string;
}

// =========================================================
// INITIAL MOCK DATA GENERATORS
// =========================================================
// Mock data generator removed

export const QUIZ = [
  { q: "What does “CTA” stand for in a marketing campaign?", opts: ["Call to Action", "Content Targeting Analysis", "Customer Trend Audit", "Click Through Average"], correct: 0 },
  { q: "Which metric best measures audience engagement on a Reel?", opts: ["Domain authority", "Likes, comments & shares", "Server uptime", "Email open rate"], correct: 1 },
  { q: "A campaign's “concept” primarily defines:", opts: ["The production budget", "The core creative idea behind the message", "The hashtag length", "The font used in ads"], correct: 1 },
  { q: "In the AIDA model, what comes right after Attention?", opts: ["Action", "Desire", "Interest", "Decision"], correct: 2 },
  { q: "What's the main goal of a 90-second short-form ad?", opts: ["Explain pricing in detail", "Hook attention and drive quick recall", "List all product features", "Replace the full campaign"], correct: 1 },
];

export function initials(str: string) {
  return str.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
}

export const isSlotOver = (label: string | undefined): boolean => {
  if (!label) return false;
  try {
    const cleanLabel = label.replace(/[\u2012\u2013\u2014-]/g, "-");
    const parts = cleanLabel.split("-");
    if (parts.length !== 2) return false;

    const parseTimeToMinutes = (timeStr: string) => {
      const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === "PM";
      if (h === 12 && !isPM) h = 0;
      if (h !== 12 && isPM) h += 12;
      return h * 60 + m;
    };

    const endMinutes = parseTimeToMinutes(parts[1]);
    if (endMinutes === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes > endMinutes;
  } catch (e) {
    return false;
  }
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    "not-started": ["badge-gray", "Not started"],
    "in-progress": ["badge-amber", "In progress"],
    "submitted": ["badge-green", "Submitted"],
    "not-submitted": ["badge-gray", "Not submitted"],
    "pending": ["badge-amber", "Pending review"],
    "approved": ["badge-green", "Approved"],
    "rejected": ["badge-red", "Changes requested"],
    "live": ["badge-green", "Live"],
    "closed": ["badge-navy", "Closed"],
  };
  const [cls, label] = map[status] || ["badge-gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// =========================================================
// CONTEXT CREATION
// =========================================================

interface StateContextProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  judges: Judge[];
  setJudges: React.Dispatch<React.SetStateAction<Judge[]>>;
  slots: Slot[];
  rounds: Record<string, "not-started" | "live" | "closed">;
  setRounds: React.Dispatch<React.SetStateAction<Record<string, "not-started" | "live" | "closed">>>;
  
  gaplytiqUploadRequested: boolean;
  setGaplytiqUploadRequested: React.Dispatch<React.SetStateAction<boolean>>;

  collegeAdminName: string;
  setCollegeAdminName: React.Dispatch<React.SetStateAction<string>>;
  collegeAdminId: string;
  setCollegeAdminId: React.Dispatch<React.SetStateAction<string>>;
  currentJury: Judge | null;
  setCurrentJury: React.Dispatch<React.SetStateAction<Judge | null>>;
  currentStudent: { studentId: string; phone: string; name: string; collegeId: string } | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<{ studentId: string; phone: string; name: string; collegeId: string } | null>>;

  toasts: Toast[];
  addToast: (msg: string, type?: "success" | "error", title?: string) => void;

  slotInfo: (slotId: string | null) => { slot: Slot | undefined; filled: number };
  studentAverage: (s: Student) => number;
}

const StateContext = createContext<StateContextProps | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rounds, setRounds] = useState<Record<string, "not-started" | "live" | "closed">>({
    round1: "not-started",
    round2: "not-started",
    round3: "not-started",
  });
  
  const [gaplytiqUploadRequested, setGaplytiqUploadRequested] = useState(false);

  const [collegeAdminName, setCollegeAdminName] = useState("Alliance University");
  const [collegeAdminId, setCollegeAdminId] = useState("");
  const [currentJury, setCurrentJury] = useState<Judge | null>(null);
  const [currentStudent, setCurrentStudent] = useState<{ studentId: string; phone: string; name: string; collegeId: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("collegeAdminName");
      const savedId = localStorage.getItem("collegeAdminId");
      if (savedName) setCollegeAdminName(savedName);
      if (savedId) setCollegeAdminId(savedId);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && collegeAdminName) {
      localStorage.setItem("collegeAdminName", collegeAdminName);
    }
  }, [collegeAdminName]);

  useEffect(() => {
    if (typeof window !== "undefined" && collegeAdminId) {
      localStorage.setItem("collegeAdminId", collegeAdminId);
    }
  }, [collegeAdminId]);

  useEffect(() => {
    const targetCollegeId = collegeAdminId || currentStudent?.collegeId;
    if (!targetCollegeId) return;

    const fetchRounds = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/college-settings/${encodeURIComponent(targetCollegeId)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setRounds({
            round1: json.data.round1_status || "not-started",
            round2: json.data.round2_status || "not-started",
            round3: json.data.round3_status || "not-started",
          });
        }
      } catch (err) {
        console.error("Failed to load rounds:", err);
      }
    };

    fetchRounds();
    // Poll for changes every 5 seconds for live sync
    const interval = setInterval(fetchRounds, 5000);
    return () => clearInterval(interval);
  }, [collegeAdminId, currentStudent?.collegeId]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (msg: string, type?: "success" | "error", title?: string) => {
    const id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, msg, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  useEffect(() => {
    const targetCollegeId = collegeAdminId || currentJury?.collegeId || currentStudent?.collegeId;
    
    const fetchJudges = async () => {
      try {
        const url = targetCollegeId 
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/judges?college_id=${encodeURIComponent(targetCollegeId)}`
          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/judges`;
          
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setJudges(json.data);
        }
      } catch (err) {
        console.error("Failed to load judges:", err);
      }
    };
    fetchJudges();
  }, [collegeAdminId, currentJury?.collegeId, currentStudent?.collegeId]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/slots`);
        const json = await res.json();
        if (json.success) {
          const parseTime = (label: string) => {
            const match = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return 0;
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const isPM = match[3].toUpperCase() === "PM";
            if (h === 12 && !isPM) h = 0;
            if (h !== 12 && isPM) h += 12;
            return h * 60 + m;
          };
          const sortedSlots = json.data.sort((a: any, b: any) => parseTime(a.label) - parseTime(b.label));
          setSlots(sortedSlots);
        }
      } catch (err) {
        console.error("Failed to load slots:", err);
      }
    };
    fetchSlots();
  }, []);

  useEffect(() => {
    const targetCollegeId = collegeAdminId || currentJury?.collegeId || currentStudent?.collegeId;
    if (!targetCollegeId) return;

    const fetchStudents = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/students?college_id=${encodeURIComponent(targetCollegeId)}`);
        const json = await res.json();
        if (json.success) {
          // Map DB snake_case fields back to camelCase
          const mapped = json.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email || "",
            phone: s.phone,
            collegeId: s.college_id,
            college: collegeAdminName || "Alliance University",
            slotId: s.slot_id,
            teamId: s.teamId || s.team_id || null,
            team: (() => {
              const t = s.teams;
              if (!t) return null;
              const resolved = Array.isArray(t) ? t[0] : t;
              if (!resolved) return null;
              return {
                id: resolved.id,
                name: resolved.name,
                leaderId: resolved.leader_id || resolved.leaderId || null,
                qualifiedR3: resolved.qualified_r3 || resolved.qualifiedR3 || false
              };
            })(),
            round1Status: s.round1_status || "not-started",
            r1Score: s.r1_score,
            proctoringFlagged: Boolean(s.proctoring_flagged),
            proctoringNote: s.proctoring_note || null,
            round2: { status: s.round2_status || "not-submitted", link: s.r2_link || "", note: s.r2_note || "", juryScore: s.r2_score || null }, 
            round3: { status: s.round3_status || "not-submitted", link: s.r3_link || "", note: s.r3_note || "", juryScore: s.r3_score || null },
          }));
          setStudents(mapped);
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    fetchStudents();
    const interval = setInterval(fetchStudents, 5000);
    return () => clearInterval(interval);
  }, [collegeAdminId, collegeAdminName, currentJury?.collegeId, currentStudent?.collegeId]);

  const slotInfo = (slotId: string | null) => {
    const slot = slots.find(s => s.id === slotId);
    const filled = students.filter(s => s.slotId === slotId).length;
    return { slot, filled };
  };

  const studentAverage = (s: Student) => {
    const scores: number[] = [];
    
    let r1 = s.r1Score;
    if (r1 === null && s.slotId) {
      const studentSlot = slots.find(sl => sl.id === s.slotId);
      if (studentSlot && isSlotOver(studentSlot.label)) {
        r1 = 0;
      }
    }

    if (r1 !== null) scores.push(r1 / 3);
    if (s.round2.juryScore !== null) scores.push(s.round2.juryScore);
    if (s.round3.juryScore !== null) scores.push(s.round3.juryScore);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  };

  return (
    <StateContext.Provider
      value={{
        students, setStudents,
        judges, setJudges,
        slots,
        rounds, setRounds,
        gaplytiqUploadRequested, setGaplytiqUploadRequested,
        collegeAdminName, setCollegeAdminName,
        collegeAdminId, setCollegeAdminId,
        currentJury, setCurrentJury,
        currentStudent, setCurrentStudent,
        toasts, addToast,
        slotInfo, studentAverage,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useStateContext() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useStateContext must be used within a StateProvider");
  }
  return context;
}
