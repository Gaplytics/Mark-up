"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// =========================================================
// TYPES & DATA STRUCTURES
// =========================================================
export interface Member {
  name: string;
  phone: string;
  r1Score: number | null;
}

export interface RoundSubmission {
  status: "not-submitted" | "pending" | "approved" | "rejected";
  link: string;
  note: string;
  juryScore: number | null;
}

export interface Group {
  id: string;
  name: string;
  college: string;
  members: Member[];
  slotId: string | null;
  round1Status: "not-started" | "in-progress" | "submitted";
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
const FIRST = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ishita", "Vivaan", "Ananya", "Aditya", "Sara", "Arjun", "Tara", "Kunal", "Nisha", "Yash", "Priya", "Dev", "Riya", "Karan", "Simran"];
const LAST = ["Sharma", "Mehta", "Kapoor", "Iyer", "Singh", "Nair", "Verma", "Das", "Reddy", "Joshi"];

function rndName(seed: number) {
  return FIRST[seed % FIRST.length] + " " + LAST[(seed * 3 + 1) % LAST.length];
}

function rndPhone(seed: number) {
  return "98" + String(10000000 + seed * 137).slice(0, 8);
}

function buildSeedGroups(): Group[] {
  const names = ["BrandStorm", "PixelPitch", "Funnel Five", "HypeHive", "MarketMavens", "ReelDeal", "CampaignX", "AdRenaline", "BuzzCraft", "ThePivot"];
  const groups: Group[] = [];
  const slotsList = ["S1", "S2", "S3"];

  for (let i = 0; i < 10; i++) {
    const members: Member[] = [];
    for (let m = 0; m < 5; m++) {
      const seed = i * 5 + m;
      members.push({ name: rndName(seed), phone: rndPhone(seed), r1Score: null });
    }
    groups.push({
      id: "G" + (i + 1),
      name: names[i],
      college: "Alliance University",
      members,
      slotId: slotsList[i % slotsList.length], // auto-assigned
      round1Status: "not-started",
      round2: { status: "not-submitted", link: "", note: "", juryScore: null },
      round3: { status: "not-submitted", link: "", note: "", juryScore: null },
    });
  }
  return groups;
}

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
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  judges: Judge[];
  setJudges: React.Dispatch<React.SetStateAction<Judge[]>>;
  slots: Slot[];
  rounds: Record<string, "not-started" | "live" | "closed">;
  setRounds: React.Dispatch<React.SetStateAction<Record<string, "not-started" | "live" | "closed">>>;
  
  gaplytiqUploadRequested: boolean;
  setGaplytiqUploadRequested: React.Dispatch<React.SetStateAction<boolean>>;

  collegeAdminName: string;
  setCollegeAdminName: React.Dispatch<React.SetStateAction<string>>;
  currentJury: Judge | null;
  setCurrentJury: React.Dispatch<React.SetStateAction<Judge | null>>;
  currentStudent: { groupId: string; memberIdx: number; phone: string; name: string } | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<{ groupId: string; memberIdx: number; phone: string; name: string } | null>>;

  toasts: Toast[];
  addToast: (msg: string, type?: "success" | "error", title?: string) => void;

  slotInfo: (slotId: string | null) => { slot: Slot | undefined; filled: number };
  groupRound1Avg: (g: Group) => number | null;
  groupTotal: (g: Group) => number;
}

const StateContext = createContext<StateContextProps | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [judges, setJudges] = useState<Judge[]>([
    { id: "J1", name: "Dr. Kavita Rao", email: "kavita.rao@alliance.edu.in", dept: "Marketing" },
    { id: "J2", name: "Prof. Sameer Bhatt", email: "sameer.bhatt@alliance.edu.in", dept: "Strategy" },
    { id: "J3", name: "Dr. Leela Krishnan", email: "leela.k@alliance.edu.in", dept: "Digital Media" },
  ]);
  const [slots] = useState<Slot[]>([
    { id: "S1", label: "Day 1 · 9:00 – 10:30 AM", capacity: 40 },
    { id: "S2", label: "Day 1 · 11:00 – 12:30 PM", capacity: 40 },
    { id: "S3", label: "Day 1 · 2:00 – 3:30 PM", capacity: 40 },
  ]);
  const [rounds, setRounds] = useState<Record<string, "not-started" | "live" | "closed">>({
    round1: "not-started",
    round2: "not-started",
    round3: "not-started",
  });
  
  const [gaplytiqUploadRequested, setGaplytiqUploadRequested] = useState(false);

  const [collegeAdminName, setCollegeAdminName] = useState("Alliance University");
  const [currentJury, setCurrentJury] = useState<Judge | null>(null);
  const [currentStudent, setCurrentStudent] = useState<{ groupId: string; memberIdx: number; phone: string; name: string } | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (msg: string, type?: "success" | "error", title?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  useEffect(() => {
    setGroups(buildSeedGroups());
  }, []);

  const slotInfo = (slotId: string | null) => {
    const slot = slots.find(s => s.id === slotId);
    const filled = groups.filter(g => g.slotId === slotId).reduce((a, g) => a + g.members.length, 0);
    return { slot, filled };
  };

  const groupRound1Avg = (g: Group) => {
    const done = g.members.filter(m => m.r1Score !== null);
    if (done.length === 0) return null;
    return Math.round((done.reduce((a, m) => a + (m.r1Score || 0), 0) / done.length) * 10) / 10;
  };

  const groupTotal = (g: Group) => {
    const r1 = groupRound1Avg(g) || 0;
    const r2 = g.round2.juryScore || 0;
    const r3 = g.round3.juryScore || 0;
    return Math.round((r1 + r2 + r3) * 10) / 10;
  };

  return (
    <StateContext.Provider
      value={{
        groups, setGroups,
        judges, setJudges,
        slots,
        rounds, setRounds,
        gaplytiqUploadRequested, setGaplytiqUploadRequested,
        collegeAdminName, setCollegeAdminName,
        currentJury, setCurrentJury,
        currentStudent, setCurrentStudent,
        toasts, addToast,
        slotInfo, groupRound1Avg, groupTotal,
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
