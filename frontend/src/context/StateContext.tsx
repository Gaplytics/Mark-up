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

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  collegeId: string;
  college: string;
  slotId: string | null;
  teamName: string | null;
  round1Status: "not-started" | "in-progress" | "submitted";
  r1Score: number | null;
  round2: RoundSubmission;
  round3: RoundSubmission;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  dept: string;
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
  currentStudent: { studentId: string; phone: string; name: string } | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<{ studentId: string; phone: string; name: string } | null>>;

  toasts: Toast[];
  addToast: (msg: string, type?: "success" | "error", title?: string) => void;

  slotInfo: (slotId: string | null) => { slot: Slot | undefined; filled: number };
  studentTotal: (s: Student) => number;
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
  const [currentStudent, setCurrentStudent] = useState<{ studentId: string; phone: string; name: string } | null>(null);

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

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (msg: string, type?: "success" | "error", title?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/judges");
        const json = await res.json();
        if (json.success) {
          setJudges(json.data);
        }
      } catch (err) {
        console.error("Failed to load judges:", err);
      }
    };
    fetchJudges();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/slots");
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
    if (!collegeAdminId) return;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/students?college_id=${encodeURIComponent(collegeAdminId)}`);
        const json = await res.json();
        if (json.success) {
          // Map DB snake_case fields back to camelCase
          const mapped = json.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email || "",
            phone: s.phone,
            collegeId: s.college_id,
            college: collegeAdminName,
            slotId: s.slot_id,
            teamName: s.team_name || s.teamName || null,
            round1Status: s.round1_status || "not-started",
            r1Score: s.r1_score,
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
  }, [collegeAdminId, collegeAdminName]);

  const slotInfo = (slotId: string | null) => {
    const slot = slots.find(s => s.id === slotId);
    const filled = students.filter(s => s.slotId === slotId).length;
    return { slot, filled };
  };

  const studentTotal = (s: Student) => {
    const r1 = s.r1Score || 0;
    const r2 = s.round2.juryScore || 0;
    const r3 = s.round3.juryScore || 0;
    return Math.round((r1 + r2 + r3) * 10) / 10;
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
        slotInfo, studentTotal,
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
