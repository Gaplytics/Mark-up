"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, Student, Judge, StatusBadge, initials } from "@/context/StateContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const renderVideoEmbed = (link: string) => {
  if (!link) return null;
  
  // YouTube embed
  const ytMatch = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?.*v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <iframe 
        width="100%" 
        height="300" 
        src={`https://www.youtube.com/embed/${ytMatch[1]}`} 
        title="YouTube video player" 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen 
        style={{ borderRadius: "8px", marginTop: "12px" }}
      ></iframe>
    );
  }
  
  // Google Drive embed
  const driveMatch = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return (
      <iframe 
        src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`} 
        width="100%" 
        height="300" 
        allow="autoplay"
        style={{ borderRadius: "8px", marginTop: "12px", border: "none" }}
      ></iframe>
    );
  }
  
  // Direct MP4
  if (link.toLowerCase().endsWith('.mp4')) {
    return (
      <video width="100%" height="300" controls style={{ borderRadius: "8px", marginTop: "12px", background: "#000" }}>
        <source src={link} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
  
  // Fallback for unknown links
  return (
    <div style={{ marginTop: "12px", padding: "16px", background: "#f8f9fc", borderRadius: "8px", textAlign: "center", border: "1px dashed var(--line)" }}>
      <p style={{ fontSize: "13px", color: "var(--slate-2)", marginBottom: "8px" }}>This link format cannot be embedded directly.</p>
      <a href={link} target="_blank" rel="noreferrer" className="btn btn-outline-coral btn-sm" style={{ textDecoration: "none" }}>Open Video ↗</a>
    </div>
  );
};

export default function CollegeDashboardPage() {
  const router = useRouter();
  const {
    collegeAdminName,
    collegeAdminId,
    students, setStudents,
    judges, setJudges,
    slots,
    rounds, setRounds,
    gaplytiqUploadRequested, setGaplytiqUploadRequested,
    addToast,
    slotInfo, studentAverage
  } = useStateContext();

  const [collegeTab, setCollegeTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string | null>(null);
  const [teamFormationSlot, setTeamFormationSlot] = useState<string | null>(null);

  const [judgeToRemove, setJudgeToRemove] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [bulkRemoveConfirm, setBulkRemoveConfirm] = useState(false);
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState<string | null>(null);
  const [showR2SubmissionsModal, setShowR2SubmissionsModal] = useState(false);
  const [activePreviewReel, setActivePreviewReel] = useState<string | null>(null);

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.phone.trim()) {
      addToast("Name, email, and phone are required.", "error", "Missing info — ");
      return;
    }
    if (!newStudent.email.includes('@')) {
      addToast("Please enter a valid email address.", "error", "Invalid email — ");
      return;
    }
    if (!/^\d{10}$/.test(newStudent.phone.trim())) {
      addToast("Mobile number must be exactly 10 digits.", "error", "Invalid phone — ");
      return;
    }

    const emailLower = newStudent.email.trim().toLowerCase();
    if (students.some(s => s.email.toLowerCase() === emailLower)) {
      addToast("A student with this email is already on the roster.", "error", "Duplicate email — ");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudent.name.trim(),
          email: newStudent.email.trim(),
          phone: newStudent.phone.trim(),
          collegeId: collegeAdminId,
          slotId: null,
          round1Status: "not-started",
          r1Score: null,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const dbStudent = data.data;
      const student: Student = {
        id: dbStudent.id,
        name: dbStudent.name,
        email: dbStudent.email || "",
        phone: dbStudent.phone,
        collegeId: dbStudent.college_id,
        college: collegeAdminName,
        slotId: dbStudent.slot_id,
        round1Status: dbStudent.round1_status || "not-started",
        r1Score: dbStudent.r1_score,
        teamId: null, team: null,
        round2: { status: "not-submitted", link: "", note: "", juryScore: null },
        round3: { status: "not-submitted", link: "", note: "", juryScore: null },
      };

      setStudents([...students, student]);
      addToast(student.name + " added.", "success", "Student added — ");
      setNewStudent({ name: "", email: "", phone: "" });
    } catch (err: any) {
      addToast("Failed to save student: " + err.message, "error", "Error — ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveStudent = (id: string) => {
    setStudentToRemove(id);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    const id = studentToRemove;
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:3001/api/students/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStudents(students.filter(s => s.id !== id));
      setSelectedStudents(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      addToast("Student removed.", "success");
      setStudentToRemove(null);
    } catch (err: any) {
      addToast("Failed to remove student: " + err.message, "error", "Error — ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRemoveStudents = () => {
    if (selectedStudents.size === 0) return;
    setBulkRemoveConfirm(true);
  };

  const confirmBulkRemoveStudents = async () => {
    const ids = Array.from(selectedStudents);
    if (ids.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:3001/api/students/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStudents(students.filter(s => !selectedStudents.has(s.id)));
      setSelectedStudents(new Set());
      addToast(`Successfully removed ${ids.length} students.`, "success");
      setBulkRemoveConfirm(false);
    } catch (err: any) {
      addToast("Failed to remove students: " + err.message, "error", "Error — ");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudents.size > 0 && selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let addedCount = 0;
        let skippedCount = 0;
        let duplicateCount = 0;
        const newStudents = [...students];
        
        // Track seen emails (from existing state and new additions) in lowercase
        const seenEmails = new Set(students.map(s => s.email.toLowerCase()));

        data.forEach((row: any) => {
          const name = row['Name'] || row['name'] || row['Full Name'];
          const email = row['Email'] || row['email'] || row['Email Address'];
          const phone = row['Phone'] || row['phone'] || row['Mobile'] || row['Mobile Number'];

          if (name && phone) {
            const emailStr = email ? String(email).trim() : "";
            const phoneStr = String(phone).trim();
            const emailLower = emailStr.toLowerCase();

            if (emailStr.includes('@') && /^\d{10}$/.test(phoneStr)) {
              if (seenEmails.has(emailLower)) {
                duplicateCount++;
              } else {
                seenEmails.add(emailLower);
                newStudents.push({
                  id: "ST_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                  name: String(name).trim(),
                  email: emailStr,
                  phone: phoneStr,
                  collegeId: collegeAdminId,
                  college: collegeAdminName,
                  slotId: null,
                  teamId: null, team: null,
                  round1Status: "not-started",
                  r1Score: null,
                  round2: { status: "not-submitted", link: "", note: "", juryScore: null },
                  round3: { status: "not-submitted", link: "", note: "", juryScore: null },
                });
                addedCount++;
              }
            } else {
              skippedCount++;
            }
          }
        });

        if (addedCount > 0) {
          const itemsToSave = newStudents.slice(newStudents.length - addedCount);
          try {
            const res = await fetch("http://localhost:3001/api/students/bulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ students: itemsToSave.map(s => ({
                name: s.name,
                email: s.email,
                phone: s.phone,
                collegeId: s.collegeId,
                slotId: s.slotId,
                round1Status: s.round1Status,
                r1Score: s.r1Score,
              })) })
            });
            const dbData = await res.json();
            if (!dbData.success) throw new Error(dbData.error);

            const mappedDbStudents = dbData.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              email: s.email || "",
              phone: s.phone,
              collegeId: s.college_id,
              college: collegeAdminName,
              slotId: s.slot_id,
              round1Status: s.round1_status || "not-started",
              r1Score: s.r1_score,
              round2: { status: "not-submitted", link: "", note: "", juryScore: null },
              round3: { status: "not-submitted", link: "", note: "", juryScore: null },
            }));

            setStudents([...students, ...mappedDbStudents]);
            
            let message = `Successfully added ${addedCount} students!`;
            if (duplicateCount > 0) message += ` (${duplicateCount} duplicate emails skipped.)`;
            if (skippedCount > 0) message += ` (${skippedCount} skipped due to invalid data.)`;
            
            addToast(message, "success", "Upload complete — ");
          } catch (err: any) {
            addToast("Failed to save uploaded students: " + err.message, "error", "Error — ");
          }
        } else {
          let message = "No valid new students found.";
          if (duplicateCount > 0) message += ` (${duplicateCount} duplicates skipped.)`;
          if (skippedCount > 0) message += ` (${skippedCount} invalid rows skipped.)`;
          addToast(message, "error", "Parse failed");
        }
      } catch (err) {
        addToast("Failed to parse file. Make sure it's a valid Excel or CSV.", "error", "Upload failed");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      addToast("Failed to read file.", "error", "Upload failed");
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleToggleGaplytiq = () => {
    const nextVal = !gaplytiqUploadRequested;
    setGaplytiqUploadRequested(nextVal);
    addToast(nextVal ? "Gaplytiq has been notified to upload your teams." : "Request withdrawn.", "success");
  };

  const [newJudgeName, setNewJudgeName] = useState("");
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [newJudgeDept, setNewJudgeDept] = useState("");

  const handleAddJudge = async () => {
    if (!newJudgeName.trim() || !newJudgeEmail.trim()) {
      addToast("Name and email are required.", "error", "Missing info — ");
      return;
    }

    if (!collegeAdminId) {
      addToast("Session expired. Please log out and sign in again.", "error", "Missing ID — ");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newJudgeName.trim(),
          email: newJudgeEmail.trim().toLowerCase(),
          dept: newJudgeDept.trim() || "Marketing",
          college_id: collegeAdminId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        addToast(newJudgeName + " appointed successfully! Invitation email sent.", "success", "Judge appointed — ");
        setNewJudgeName("");
        setNewJudgeEmail("");
        setNewJudgeDept("");
        
        // Refresh judges list from database
        const freshRes = await fetch("http://localhost:3001/api/judges");
        const freshJson = await freshRes.json();
        if (freshJson.success) {
          setJudges(freshJson.data);
        }
      } else {
        addToast(`Failed to appoint judge: ${json.error}`, "error", "Appointment failed");
      }
    } catch (err) {
      addToast("Network error: Could not connect to backend.", "error", "Appointment failed");
    }
  };

  const confirmRemoveJudge = async () => {
    if (!judgeToRemove) return;
    const id = judgeToRemove;
    setJudgeToRemove(null); // close modal immediately for snappy UI
    
    try {
      const res = await fetch(`http://localhost:3001/api/judges/${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        setJudges(judges.filter(j => j.id !== id));
        addToast("Judge removed from panel.", "success");
      } else {
        addToast(`Failed to remove judge: ${json.error}`, "error", "Removal failed");
      }
    } catch (err) {
      addToast("Network error: Could not connect to backend.", "error", "Removal failed");
    }
  };

  const handleFlagOffRound = async (roundKey: string) => {
    const newRounds = { ...rounds, [roundKey]: "live" };
    setRounds(newRounds as any);
    if (roundKey === "round1") {
      setStudents(students.map(s => ({ ...s, round1Status: "in-progress" })));
    }
    addToast("Students can now begin " + roundKey.replace("round", "Round "), "success", "Round flagged off — ");
    
    try {
      await fetch(`http://localhost:3001/api/college-settings/${collegeAdminId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round1_status: newRounds.round1,
          round2_status: newRounds.round2,
          round3_status: newRounds.round3
        })
      });
    } catch (err) {
      console.error("Failed to sync round state", err);
    }
  };

  const handleCloseRound = async (roundKey: string) => {
    const newRounds = { ...rounds, [roundKey]: "closed" };
    setRounds(newRounds as any);
    addToast(roundKey.replace("round", "Round ") + " is now closed for submissions.", "success");
    
    try {
      await fetch(`http://localhost:3001/api/college-settings/${collegeAdminId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round1_status: newRounds.round1,
          round2_status: newRounds.round2,
          round3_status: newRounds.round3
        })
      });
    } catch (err) {
      console.error("Failed to sync round state", err);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Live Leaderboard - MarkUp", 14, 15);
      
      const tableData = [...students]
        .map(s => ({ s, avg: studentAverage(s) }))
        .sort((a, b) => b.avg - a.avg)
        .map((r, i) => [
          `#${i + 1}`,
          r.s.name,
          r.s.r1Score !== null ? "Tested" : "—",
          r.s.r1Score !== null ? r.s.r1Score.toFixed(1) : "—",
          r.s.round2.juryScore !== null ? r.s.round2.juryScore.toFixed(1) : (r.s.round2.status === "pending" ? "Pending" : "Not submitted"),
          r.s.round3.juryScore !== null ? r.s.round3.juryScore.toFixed(1) : (r.s.round3.status === "pending" ? "Pending" : "Not submitted"),
          r.avg.toFixed(1)
        ]);

      autoTable(doc, {
        head: [["Rank", "Student", "R1 Status", "R1 Score", "R2 Score", "R3 Score", "Average"]],
        body: tableData,
        startY: 20
      });

      doc.save("leaderboard.pdf");
      addToast("Live dashboard exported as PDF.", "success", "Exported ");
    } catch (err: any) {
      console.error(err);
      addToast("Failed to generate PDF.", "error");
    }
  };

  const totalTeams = new Set(students.map(s => s.team?.name).filter(Boolean));
  const totalUnteamedStudentsCount = students.filter(s => !s.team?.name).length;
  const totalReelsCount = totalTeams.size + totalUnteamedStudentsCount;

  const submittedTeamNames = new Set(
    students
      .filter(s => s.round2.status !== "not-submitted" && s.team?.name)
      .map(s => s.team?.name)
  );
  const submittedIndividualCount = students.filter(
    s => s.round2.status !== "not-submitted" && !s.team?.name
  ).length;
  const submittedReelsCount = submittedTeamNames.size + submittedIndividualCount;

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div id="screen-college-app">
      <div className="app-shell">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
        )}

        {/* Sidebar */}
        <div className={`sidebar ${!isSidebarOpen ? "collapsed" : ""} ${isMobileSidebarOpen ? "mobile-open" : ""}`}>
          <div className="desktop-sidebar-toggle" style={{ display: "flex", justifyContent: isSidebarOpen ? "flex-end" : "center", marginBottom: 16 }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: "transparent", border: "none", color: "#C7CDE8", fontSize: 20, cursor: "pointer" }}
              title="Toggle Sidebar"
            >
              ☰
            </button>
          </div>
          <div className="brand">
            <img src="/logo-icon.png" alt="Logo" style={{ width: "30px", height: "30px", marginRight: "8px", objectFit: "contain" }} />
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <div className="side-portal-tag">College Admin</div>
          <div className="side-nav">
            <div className={`side-link ${collegeTab === "overview" ? "active" : ""}`} onClick={() => { setCollegeTab("overview"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span className="lbl">Overview</span>
            </div>
            <div className={`side-link ${collegeTab === "teams" ? "active" : ""}`} onClick={() => { setCollegeTab("teams"); setSelectedSlotFilter(null); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span className="lbl">Manage Students</span>
            </div>
            <div className={`side-link ${collegeTab === "judges" ? "active" : ""}`} onClick={() => { setCollegeTab("judges"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span className="lbl">Appoint Judges</span>
            </div>
            <div className={`side-link ${collegeTab === "rounds" ? "active" : ""}`} onClick={() => { setCollegeTab("rounds"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span className="lbl">Round Control</span>
            </div>
            <div className={`side-link ${collegeTab === "dashboard" ? "active" : ""}`} onClick={() => { setCollegeTab("dashboard"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span className="lbl">Live Dashboard</span>
            </div>
          </div>
          <div className="side-foot">
            <div className="side-user">
              <div className="avatar">{initials(collegeAdminName)}</div>
              <div>
                <div className="u-name">{collegeAdminName}</div>
                <div className="u-role">College Admin</div>
              </div>
            </div>
            <div className="side-link" onClick={handleLogout} style={{ marginTop: 6, cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Log out</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center" }}>
              <button className="mobile-nav-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
              <div>
                <h2>
                  {collegeTab === "overview" && "Overview"}
                  {collegeTab === "teams" && "Manage Students"}
                  {collegeTab === "judges" && "Appoint Judges"}
                {collegeTab === "rounds" && "Round Control"}
                {collegeTab === "dashboard" && "Live Dashboard"}
              </h2>
              <div className="sub">
                {collegeTab === "overview" && "Everything happening across MarkUp, in real time"}
                {collegeTab === "teams" && "Upload students via Excel, or let Gaplytiq handle it for you"}
                {collegeTab === "judges" && "Add School of Business faculty to the jury panel"}
                {collegeTab === "rounds" && "Flag off and close each round when your campus is ready"}
                {collegeTab === "dashboard" && "Real-time participation and scores, by student"}
              </div>
            </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <StatusBadge status={rounds.round1 === "not-started" ? "not-started" : rounds.round1 === "live" ? "live" : "closed"} />
            </div>
          </div>

          <div className="content">
            {/* --- OVERVIEW --- */}
            {collegeTab === "overview" && (
              <>
                <div className="grid grid-4" style={{ marginBottom: 22 }}>
                  <div className="card stat-card">
                    <div className="label">Students registered</div>
                    <div className="value">{students.length}</div>
                    <div className="delta">Individual participants</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Jury appointed</div>
                    <div className="value">{judges.length}</div>
                    <div className="delta">SOB faculty</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 1 complete</div>
                    <div className="value">{students.filter(s => s.r1Score !== null).length}/{students.length}</div>
                    <div className="delta">students with a score</div>
                  </div>
                  <div 
                    className="card stat-card"
                    onClick={() => setShowR2SubmissionsModal(true)}
                    style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="label">Round 2 submitted</div>
                    <div className="value">{submittedReelsCount}/{totalReelsCount}</div>
                    <div className="delta">reels received</div>
                  </div>
                </div>

                <div className="grid grid-3">
                  <div className="card card-pad">
                    <div className="section-title">Round status</div>
                    <div className="section-desc">Flag off rounds from Round Control when your campus is ready.</div>
                    <div className="stack">
                      {["round1", "round2", "round3"].map((r, i) => (
                        <div key={r} className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                          <div>
                            <b style={{ fontSize: 13.5 }}>Round {i + 1}</b>
                            <div style={{ fontSize: 12, color: "var(--slate-2)", marginTop: 2 }}>
                              {["Individual Test", "90-Sec Reel", "Demo Day Film"][i]}
                            </div>
                          </div>
                          <StatusBadge status={rounds[r]} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card card-pad">
                    <div className="section-title">Slot Selection Summary</div>
                    <div className="section-desc">Real-time slot choices selected by students.</div>
                    <div className="stack" style={{ marginTop: 6 }}>
                      {slots.map(slot => {
                        const slotStudents = students.filter(s => s.slotId === slot.id);
                        const unassignedInSlot = slotStudents.filter(s => !s.teamId);
                        const alreadyTeamed = unassignedInSlot.length === 0 && slotStudents.length > 0;
                        return (
                          <div key={slot.id} style={{ fontSize: 13, padding: "10px 12px", background: "#fdfdfd", border: "1px solid var(--line)", borderRadius: 8 }}>
                            <div className="row-between">
                              <span style={{ fontWeight: 600 }}>{slot.label}</span>
                              {alreadyTeamed ? (
                                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: "rgba(34,197,94,0.12)", color: "#16a34a", fontWeight: 600 }}>✓ Teamed</span>
                              ) : (
                                <button
                                  className="btn btn-coral btn-sm"
                                  style={{ padding: "3px 10px", fontSize: 12 }}
                                  disabled={isProcessing || slotStudents.length === 0}
                                  onClick={async () => {
                                    if (unassignedInSlot.length === 0) { addToast("No unassigned students in this slot.", "error"); return; }
                                    setIsProcessing(true);
                                    try {
                                      const shuffled = [...unassignedInSlot].sort(() => Math.random() - 0.5);
                                      // Find existing teams and their sizes
                                      const teamsMap: Record<string, string[]> = {};
                                      slotStudents.forEach(s => {
                                        if (s.team?.name) {
                                          if (!teamsMap[s.team?.name]) teamsMap[s.team?.name] = [];
                                          teamsMap[s.team?.name].push(s.id);
                                        }
                                      });

                                      const allAssignments: Record<string, string> = {};
                                      let remaining = [...shuffled];

                                      // Step 1: Fill incomplete teams first
                                      for (const [gName, memberIds] of Object.entries(teamsMap)) {
                                        if (memberIds.length < 5 && remaining.length > 0) {
                                          const spotsLeft = 5 - memberIds.length;
                                          const toAdd = remaining.splice(0, spotsLeft);
                                          for (const s of toAdd) {
                                            allAssignments[s.id] = gName;
                                          }
                                        }
                                      }

                                      // Step 2: Create new teams of 5 from remaining (max 6 total)
                                      const MAX_GROUPS = 6;
                                      const existingTeamCount = Object.keys(teamsMap).length;
                                      let newTeamIndex = 0;
                                      const newTeams: { name: string; ids: string[] }[] = [];
                                      for (let i = 0; i < remaining.length; i += 5) {
                                        if (existingTeamCount + newTeamIndex >= MAX_GROUPS) break;
                                        const chunk = remaining.slice(i, i + 5);
                                        const gName = `Team ${existingTeamCount + newTeamIndex + 1}`;
                                        newTeamIndex++;
                                        newTeams.push({ name: gName, ids: chunk.map(s => s.id) });
                                        chunk.forEach(s => (allAssignments[s.id] = gName));
                                      }

                                      // Check if any students couldn't be assigned
                                      const assignedCount = Object.keys(allAssignments).length;
                                      const leftover = unassignedInSlot.length - assignedCount;

                                      // Save fill-ups (assign to existing team names)
                                      const fillUpsByTeam: Record<string, string[]> = {};
                                      for (const [sid, gName] of Object.entries(allAssignments)) {
                                        if (!newTeams.find(g => g.name === gName)) {
                                          if (!fillUpsByTeam[gName]) fillUpsByTeam[gName] = [];
                                          fillUpsByTeam[gName].push(sid);
                                        }
                                      }
                                      for (const [gName, sids] of Object.entries(fillUpsByTeam)) {
                                        const res = await fetch("http://localhost:3001/api/students/assign-team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentIds: sids, teamName: gName }) });
                                        const json = await res.json();
                                        if (!json.success) throw new Error(json.error);
                                      }
                                      // Save new teams
                                      for (const team of newTeams) {
                                        const res = await fetch("http://localhost:3001/api/students/assign-team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentIds: team.ids, teamName: team.name }) });
                                        const json = await res.json();
                                        if (!json.success) throw new Error(json.error);
                                      }

                                      setStudents(prev => prev.map(s => allAssignments[s.id] ? { ...s, teamId: "temp", team: { id: "temp", name: allAssignments[s.id], leaderId: null } } : s));
                                      const filledCount = Object.keys(fillUpsByTeam).length;
                                      if (leftover > 0) {
                                        addToast(`Slot is full! All 6 teams are complete. ${leftover} student(s) could not be assigned.`, "error");
                                      } else {
                                        const msg = filledCount > 0
                                          ? `Filled ${filledCount} existing team(s) and created ${newTeams.length} new team(s)!`
                                          : `${newTeams.length} teams created for ${slot.label}!`;
                                        addToast(msg, "success");
                                      }
                                      // Send team notification emails
                                      try {
                                        await fetch("http://localhost:3001/api/teams/notify", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ slotId: slot.id }),
                                        });
                                        addToast("Team emails sent to all members!", "success");
                                      } catch { /* email is non-critical */ }
                                    } catch (err: any) { addToast("Auto-team failed: " + err.message, "error"); }
                                    finally { setIsProcessing(false); }
                                  }}
                                >
                                  Form Teams
                                </button>
                              )}
                            </div>
                            <div
                              style={{ marginTop: 6, color: "var(--coral)", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={() => setShowSlotModal(slot.id)}
                            >
                              {slotStudents.length} students →
                            </div>
                          </div>
                        );
                      })}
                      <div className="row-between" style={{ fontSize: 13, padding: "10px 12px", background: "#fdfdfd", border: "1px solid var(--line)", borderRadius: 8 }}>
                        <span>Unassigned / Pending</span>
                        <strong style={{ fontSize: 13, color: "var(--coral)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setShowUnassignedModal(true)}>
                          {students.filter(s => !s.slotId).length} students <span>→</span>
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- MANAGE STUDENTS --- */}
            {collegeTab === "teams" && (
              <>
                <div className="grid grid-2">
                  <div className="card card-pad">
                    <div className="section-title">Add a student manually</div>
                    <div className="section-desc">Phone numbers are how students will sign in with OTP.</div>
                    <div className="form-team">
                      <label>Full Name</label>
                      <input className="input" placeholder="e.g. Aarav Sharma" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
                    </div>
                    <div className="form-team">
                      <label>Email Address</label>
                      <input className="input" placeholder="student@example.com" value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} />
                    </div>
                    <div className="form-team">
                      <label>Mobile Number</label>
                      <input 
                        className="input" 
                        placeholder="98XXXXXXXX" 
                        value={newStudent.phone} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNewStudent({...newStudent, phone: val});
                        }} 
                        disabled={isProcessing} 
                      />
                    </div>
                    <button className="btn btn-coral btn-block" onClick={handleAddStudent} disabled={isProcessing}>
                      {isProcessing ? "Processing..." : "Add student"}
                    </button>
                  </div>

                  <div className="card card-pad">
                    <div className="section-title">Upload via Excel or CSV</div>
                    <div className="section-desc">Upload your roster file to automatically add multiple students at once.</div>
                    <div className="upload-drop" style={{ position: "relative", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1 }}>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleFileUpload} 
                        disabled={isProcessing}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: isProcessing ? "not-allowed" : "pointer", zIndex: 10 }}
                      />
                      <div className="ico">{isProcessing ? "⏳" : "📤"}</div>
                      <div className="t">{isProcessing ? "Uploading and processing..." : "Click or drop your roster file here"}</div>
                      <div className="d">File must include columns for Name, Email, and Phone</div>
                    </div>

                  </div>
                </div>

                <div className="card card-pad" style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div className="section-title" style={{ marginBottom: 4 }}>All students ({students.filter(s => selectedSlotFilter ? (selectedSlotFilter === "unassigned" ? !s.slotId : s.slotId === selectedSlotFilter) : true).length})</div>
                      <div className="section-desc">
                        {selectedSlotFilter ? (
                          <>
                            Showing students for slot {selectedSlotFilter === "unassigned" ? "Unassigned" : (slots.find(sl => sl.id === selectedSlotFilter)?.label.split("·")[1] || selectedSlotFilter)}.
                            <button className="btn btn-ghost btn-sm" style={{ padding: "0 4px", color: "var(--coral)", marginLeft: 6 }} onClick={() => setSelectedSlotFilter(null)}>Clear filter</button>
                          </>
                        ) : "Manage your full roster."}
                      </div>
                    </div>
                    {selectedStudents.size > 0 && (
                      <button className="btn btn-coral btn-sm" onClick={handleBulkRemoveStudents}>
                        Remove Selected ({selectedStudents.size})
                      </button>
                    )}
                  </div>
                  
                  <div className="scrollx">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 40, textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={students.length > 0 && selectedStudents.size === students.length}
                              onChange={toggleAllStudents}
                            />
                          </th>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Slot</th>
                          <th>Round 1</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => selectedSlotFilter ? (selectedSlotFilter === "unassigned" ? !s.slotId : s.slotId === selectedSlotFilter) : true).map(s => {
                          const { slot } = slotInfo(s.slotId);
                          return (
                            <tr key={s.id}>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedStudents.has(s.id)}
                                  onChange={() => toggleStudent(s.id)}
                                />
                              </td>
                              <td><b>{s.name}</b></td>
                              <td>{s.email || "—"}</td>
                              <td>{s.phone}</td>
                              <td>{slot ? slot.label.split("·")[1] : "—"}</td>
                              <td><StatusBadge status={s.round1Status} /></td>
                              <td>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* --- TEAM FORMATION --- */}
            {collegeTab === "teams" && teamFormationSlot && (() => {
              const slotLabel = slots.find(s => s.id === teamFormationSlot)?.label.split("·")[1] || teamFormationSlot;
              const slotStudents = students.filter(s => s.slotId === teamFormationSlot);
              
              // Unassigned students in this slot
              const unassigned = slotStudents.filter(s => !s.teamId);
              
              // Team assigned students by teamName
              const teamsMap: Record<string, typeof slotStudents> = {};
              slotStudents.forEach(s => {
                if (s.team?.name) {
                  if (!teamsMap[s.team?.name]) teamsMap[s.team?.name] = [];
                  teamsMap[s.team?.name].push(s);
                }
              });

              const handleDisbandTeam = async (teamName: string, memberIds: string[]) => {
                setIsProcessing(true);
                try {
                  const res = await fetch("http://localhost:3001/api/students/assign-team", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentIds: memberIds, teamName: null })
                  });
                  const json = await res.json();
                  if (!json.success) throw new Error(json.error);

                  // Update local state
                  setStudents(prev => prev.map(s => {
                    if (memberIds.includes(s.id)) {
                      return { ...s, teamId: null, team: null };
                    }
                    return s;
                  }));

                  addToast(`Team "${teamName}" disbanded.`, "success");
                } catch (err: any) {
                  addToast("Failed to disband team: " + err.message, "error");
                } finally {
                  setIsProcessing(false);
                }
              };

              const handleAutoTeam = async () => {
                if (unassigned.length === 0) {
                  addToast("No unassigned students to team.", "error");
                  return;
                }
                setIsProcessing(true);
                try {
                  const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
                  const GROUP_SIZE = 5;

                  const allAssignments: Record<string, string> = {};
                  let remaining = [...shuffled];

                  // Step 1: Fill incomplete teams first
                  for (const [gName, memberIds] of Object.entries(teamsMap)) {
                    if (memberIds.length < GROUP_SIZE && remaining.length > 0) {
                      const spotsLeft = GROUP_SIZE - memberIds.length;
                      const toAdd = remaining.splice(0, spotsLeft);
                      for (const s of toAdd) {
                        allAssignments[s.id] = gName;
                      }
                    }
                  }

                  // Step 2: Create new teams from remaining (max 6 total)
                  const MAX_GROUPS = 6;
                  const existingTeamCount = Object.keys(teamsMap).length;
                  let newTeamIndex = 0;
                  const newTeams: { name: string; ids: string[] }[] = [];
                  for (let i = 0; i < remaining.length; i += GROUP_SIZE) {
                    if (existingTeamCount + newTeamIndex >= MAX_GROUPS) break;
                    const chunk = remaining.slice(i, i + GROUP_SIZE);
                    const gName = `Team ${existingTeamCount + newTeamIndex + 1}`;
                    newTeamIndex++;
                    newTeams.push({ name: gName, ids: chunk.map(s => s.id) });
                    chunk.forEach(s => (allAssignments[s.id] = gName));
                  }

                  const assignedCount = Object.keys(allAssignments).length;
                  const leftover = unassigned.length - assignedCount;

                  // Save fill-ups
                  const fillUpsByTeam: Record<string, string[]> = {};
                  for (const [sid, gName] of Object.entries(allAssignments)) {
                    if (!newTeams.find(g => g.name === gName)) {
                      if (!fillUpsByTeam[gName]) fillUpsByTeam[gName] = [];
                      fillUpsByTeam[gName].push(sid);
                    }
                  }
                  for (const [gName, sids] of Object.entries(fillUpsByTeam)) {
                    const res = await fetch("http://localhost:3001/api/students/assign-team", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ studentIds: sids, teamName: gName }),
                    });
                    const json = await res.json();
                    if (!json.success) throw new Error(json.error);
                  }
                  // Save new teams
                  for (const team of newTeams) {
                    const res = await fetch("http://localhost:3001/api/students/assign-team", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ studentIds: team.ids, teamName: team.name }),
                    });
                    const json = await res.json();
                    if (!json.success) throw new Error(json.error);
                  }

                  setStudents(prev => prev.map(s => allAssignments[s.id] ? { ...s, teamId: "temp", team: { id: "temp", name: allAssignments[s.id], leaderId: null } } : s));

                  const filledCount = Object.keys(fillUpsByTeam).length;
                  if (leftover > 0) {
                    addToast(`Slot is full! All 6 teams are complete. ${leftover} student(s) could not be assigned.`, "error");
                  } else {
                    const msg = filledCount > 0
                      ? `Filled ${filledCount} existing team(s) and created ${newTeams.length} new team(s)!`
                      : `${newTeams.length} teams of ~5 created automatically!`;
                    addToast(msg, "success");
                  }
                  // Send team notification emails
                  try {
                    await fetch("http://localhost:3001/api/teams/notify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ slotId: teamFormationSlot }),
                    });
                    addToast("Team emails sent to all members!", "success");
                  } catch { /* email is non-critical */ }
                } catch (err: any) {
                  addToast("Auto-team failed: " + err.message, "error");
                } finally {
                  setIsProcessing(false);
                }
              };

              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <button className="btn btn-ghost" style={{ paddingLeft: 0, color: "var(--coral)", fontWeight: "bold" }} onClick={() => setCollegeTab("overview")}>
                      ← Back to Overview
                    </button>
                  </div>

                  <div className="card card-pad">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div className="section-title">Teams — {slotLabel}</div>
                        <div className="section-desc">{Object.keys(teamsMap).length} team(s) formed · {unassigned.length} students still unassigned</div>
                      </div>
                      {unassigned.length > 0 && (
                        <button
                          className="btn btn-coral btn-sm"
                          disabled={isProcessing}
                          onClick={handleAutoTeam}
                        >
                          {isProcessing ? "Teaming..." : `⚡ Form ${Math.ceil(unassigned.length / 5)} More Team${Math.ceil(unassigned.length / 5) !== 1 ? "s" : ""}`}
                        </button>
                      )}
                    </div>

                    <div className="stack">
                      {Object.keys(teamsMap).length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate-2)", fontSize: 14 }}>
                          No teams formed yet. Click "Form Teams" on the Overview to auto-create teams of 5.
                        </div>
                      ) : (
                        Object.entries(teamsMap).map(([tName, members]) => (
                          <div key={tName} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, background: "#fdfdfd" }}>
                            <div className="row-between" style={{ marginBottom: 10 }}>
                              <strong style={{ fontSize: 14, color: "var(--navy)" }}>{tName}</strong>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: "var(--coral)", padding: "2px 8px" }}
                                disabled={isProcessing}
                                onClick={() => handleDisbandTeam(tName, members.map(m => m.id))}
                              >
                                Disband
                              </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {members.map(m => (
                                <span key={m.id} style={{ background: "#eee", fontSize: 11, padding: "4px 8px", borderRadius: 16 }}>
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* --- APPOINT JUDGES --- */}
            {collegeTab === "judges" && (
              <div className="grid grid-2">
                <div className="card card-pad">
                  <div className="section-title">Appoint a judge</div>
                  <div className="section-desc">Add School of Business faculty to the jury panel for this contest.</div>
                  <div className="form-team">
                    <label>Full name</label>
                    <input className="input" placeholder="Dr. Full Name" value={newJudgeName} onChange={(e) => setNewJudgeName(e.target.value)} />
                  </div>
                  <div className="form-team">
                    <label>Email</label>
                    <input className="input" placeholder="name@alliance.edu.in" value={newJudgeEmail} onChange={(e) => setNewJudgeEmail(e.target.value)} />
                  </div>
                  <div className="form-team">
                    <label>Department</label>
                    <input className="input" placeholder="e.g. Marketing" value={newJudgeDept} onChange={(e) => setNewJudgeDept(e.target.value)} />
                  </div>
                  <button className="btn btn-coral btn-block" onClick={handleAddJudge}>Appoint judge</button>
                </div>

                <div className="card card-pad">
                  <div className="section-title">Jury panel ({judges.length})</div>
                  <div className="section-desc">Each judge gets login access to review and score submissions.</div>
                  <div className="stack">
                    {judges.map(j => (
                      <div key={j.id} className="row-between" style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div className="avatar" style={{ background: "var(--navy-2)" }}>{initials(j.name)}</div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{j.name}</div>
                            <div style={{ fontSize: 12, color: "var(--slate-2)" }}>{j.email} · {j.dept}</div>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setJudgeToRemove(j.id)}>Remove</button>
                      </div>
                    ))}
                    {judges.length === 0 && (
                      <div className="empty">
                        <div className="ico">⚖️</div>
                        <div className="t">No judges appointed yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- ROUND CONTROL --- */}
            {collegeTab === "rounds" && (
              <div className="grid grid-3">
                {[
                  { key: "round1", title: "Round 1 · Individual Test", desc: "Flagging off opens OTP login and test access for all students in their assigned slots." },
                  { key: "round2", title: "Round 2 · 90-Sec Reel", desc: "Teams can upload their Reel/Short for jury review once this round is live." },
                  { key: "round3", title: "Round 3 · Demo Day Film", desc: "Teams co-create and submit their 60-second film with Gaplytiq, then upload here." },
                ].map(c => {
                  const st = rounds[c.key];
                  return (
                    <div key={c.key} className="card card-pad">
                      <div className="row-between" style={{ marginBottom: 10 }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>{c.title}</div>
                        <StatusBadge status={st} />
                      </div>
                      <p style={{ fontSize: 12.5, color: "var(--slate-2)", lineHeight: 1.55, marginBottom: 18 }}>{c.desc}</p>
                      {st === "not-started" && (
                        <button className="btn btn-coral btn-block" onClick={() => handleFlagOffRound(c.key)}>🚩 Flag off round</button>
                      )}
                      {st === "live" && (
                        <button className="btn btn-outline-coral btn-block" onClick={() => handleCloseRound(c.key)}>Close round</button>
                      )}
                      {st === "closed" && (
                        <button className="btn btn-coral btn-block" onClick={() => handleFlagOffRound(c.key)}>Re-open round</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- LIVE DASHBOARD --- */}
            {collegeTab === "dashboard" && (
              <>
                <div className="grid grid-4" style={{ marginBottom: 20 }}>
                  <div className="card stat-card">
                    <div className="label">Students participated</div>
                    <div className="value">
                      {students.filter(s => s.r1Score !== null).length}/{students.length}
                    </div>
                    <div className="delta">Round 1 individual test</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Avg. student score (R1)</div>
                    <div className="value">
                      {(() => {
                        const validScores = students.map(s => s.r1Score).filter((v): v is number => v !== null);
                        return validScores.length > 0
                          ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                          : "—";
                      })()}
                    </div>
                    <div className="delta">out of 5.0</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Reels submitted (R2)</div>
                    <div className="value">{submittedReelsCount}/{totalReelsCount}</div>
                    <div className="delta">reels received</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Demo-day films (R3)</div>
                    <div className="value">{students.filter(s => s.round3.status !== "not-submitted").length}/{students.length}</div>
                    <div className="delta">students</div>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <div className="section-title">Live leaderboard — who participated, who scored</div>
                    <button className="btn btn-ghost btn-sm" onClick={handleExportPDF}>⬇ Export PDF</button>
                  </div>
                  <div className="section-desc">Refreshes automatically as students complete the test and submit content.</div>
                  <div className="scrollx">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Student</th>
                          <th>R1 Participation</th>
                          <th>R1 Score</th>
                          <th>R2 Status</th>
                          <th>R3 Status</th>
                          <th>Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...students]
                          .map(s => ({ s, avg: studentAverage(s) }))
                          .sort((a, b) => b.avg - a.avg)
                          .map((r, i) => (
                            <tr key={r.s.id}>
                              <td><b>#{i + 1}</b></td>
                              <td>
                                <b>{r.s.name}</b>
                                <div style={{ fontSize: 11, color: "var(--slate-2)" }}>{r.s.college}</div>
                              </td>
                              <td>{r.s.r1Score !== null ? "Tested" : "—"}</td>
                              <td>{r.s.r1Score !== null ? r.s.r1Score.toFixed(1) : "—"}</td>
                              <td>{r.s.round2.juryScore !== null ? r.s.round2.juryScore.toFixed(1) : <StatusBadge status={r.s.round2.status} />}</td>
                              <td>{r.s.round3.juryScore !== null ? r.s.round3.juryScore.toFixed(1) : <StatusBadge status={r.s.round3.status} />}</td>
                              <td><b>{r.avg.toFixed(1)}</b></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODALS --- */}
      {judgeToRemove && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card card-pad" style={{ background: 'var(--bg)', width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Confirm Deletion</h3>
            <p style={{ fontSize: 14, color: 'var(--slate-2)', marginBottom: 20 }}>Are you sure you want to remove this judge? This will revoke their access to the jury panel.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setJudgeToRemove(null)}>Cancel</button>
              <button className="btn btn-coral" onClick={confirmRemoveJudge}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {studentToRemove && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card card-pad" style={{ background: 'var(--bg)', width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Remove Student</h3>
            <p style={{ fontSize: 14, color: 'var(--slate-2)', marginBottom: 20 }}>Are you sure you want to remove this student? All their progress will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStudentToRemove(null)} disabled={isProcessing}>Cancel</button>
              <button className="btn btn-coral" onClick={confirmRemoveStudent} disabled={isProcessing}>
                {isProcessing ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkRemoveConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card card-pad" style={{ background: 'var(--bg)', width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Remove Students</h3>
            <p style={{ fontSize: 14, color: 'var(--slate-2)', marginBottom: 20 }}>Are you sure you want to remove the {selectedStudents.size} selected students? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setBulkRemoveConfirm(false)} disabled={isProcessing}>Cancel</button>
              <button className="btn btn-coral" onClick={confirmBulkRemoveStudents} disabled={isProcessing}>
                {isProcessing ? "Removing..." : "Yes, Remove All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnassignedModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowUnassignedModal(false)}>
          <div className="card card-pad" style={{ background: 'var(--bg)', width: 600, maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Unassigned / Pending Students</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUnassignedModal(false)}>Close</button>
            </div>
            {students.filter(s => !s.slotId).length === 0 ? (
              <p style={{ color: 'var(--slate-2)', fontSize: 14 }}>All students have been assigned slots.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--slate-2)' }}>
                    <th style={{ padding: '8px 4px' }}>Name</th>
                    <th style={{ padding: '8px 4px' }}>Email</th>
                    <th style={{ padding: '8px 4px' }}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => !s.slotId).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                      <td style={{ padding: '10px 4px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '10px 4px', color: 'var(--slate-2)' }}>{s.email}</td>
                      <td style={{ padding: '10px 4px', color: 'var(--slate-2)' }}>{s.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showSlotModal && (() => {
        const slot = slots.find(s => s.id === showSlotModal);
        const slotStudents = students.filter(s => s.slotId === showSlotModal);
        const unteamed = slotStudents.filter(s => !s.teamId);
        const teamsMap: Record<string, typeof slotStudents> = {};
        slotStudents.forEach(s => {
          if (s.team?.name) {
            if (!teamsMap[s.team?.name]) teamsMap[s.team?.name] = [];
            teamsMap[s.team?.name].push(s);
          }
        });
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSlotModal(null)}>
            <div className="card card-pad" style={{ background: 'var(--bg)', width: 700, maxWidth: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{slot?.label}</h3>
                  <div style={{ fontSize: 13, color: 'var(--slate-2)', marginTop: 4 }}>{slotStudents.length} students · {Object.keys(teamsMap).length} teams formed</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSlotModal(null)}>Close</button>
              </div>

              {Object.keys(teamsMap).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {Object.entries(teamsMap).map(([gName, members]) => (
                    <div key={gName} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14, background: '#fdfdfd', marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{gName} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--slate-2)' }}>({members.length} members)</span></div>
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ fontSize: 11, color: 'var(--slate-2)' }}>
                            <th style={{ padding: '4px 4px' }}>Name</th>
                            <th style={{ padding: '4px 4px' }}>Email</th>
                            <th style={{ padding: '4px 4px' }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map(s => (
                            <tr key={s.id} style={{ fontSize: 13, borderTop: '1px solid var(--line)' }}>
                              <td style={{ padding: '8px 4px', fontWeight: 500 }}>{s.name}</td>
                              <td style={{ padding: '8px 4px', color: 'var(--slate-2)' }}>{s.email}</td>
                              <td style={{ padding: '8px 4px', color: 'var(--slate-2)' }}>{s.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {unteamed.length > 0 && (
                <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14, background: '#fdfdfd' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-2)', marginBottom: 8 }}>Unteamed <span style={{ fontSize: 12, fontWeight: 400 }}>({unteamed.length} students)</span></div>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ fontSize: 11, color: 'var(--slate-2)' }}>
                        <th style={{ padding: '4px 4px' }}>Name</th>
                        <th style={{ padding: '4px 4px' }}>Email</th>
                        <th style={{ padding: '4px 4px' }}>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unteamed.map(s => (
                        <tr key={s.id} style={{ fontSize: 13, borderTop: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 500 }}>{s.name}</td>
                          <td style={{ padding: '8px 4px', color: 'var(--slate-2)' }}>{s.email}</td>
                          <td style={{ padding: '8px 4px', color: 'var(--slate-2)' }}>{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {slotStudents.length === 0 && (
                <p style={{ color: 'var(--slate-2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No students have selected this slot yet.</p>
              )}
            </div>
          </div>
        );
      })()}

      {showR2SubmissionsModal && (() => {
        const teamsMap: Record<string, { members: string[], round2: typeof students[0]['round2'] }> = {};
        students.forEach(s => {
          if (s.team && s.team.name) {
            if (!teamsMap[s.team.name]) {
              teamsMap[s.team.name] = { members: [], round2: s.round2 };
            }
            if (!teamsMap[s.team.name].members.includes(s.name)) {
              teamsMap[s.team.name].members.push(s.name);
            }
          } else if (s.round2.status !== "not-submitted") {
            const key = `Individual: ${s.name}`;
            teamsMap[key] = { members: [s.name], round2: s.round2 };
          }
        });

        const teamList = Object.entries(teamsMap);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowR2SubmissionsModal(false); setActivePreviewReel(null); }}>
            <div className="card card-pad" style={{ background: 'var(--bg)', width: activePreviewReel ? '1000px' : '700px', maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto', transition: 'width 0.3s' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Round 2 Submissions (90-Sec Reel)</h3>
                  <div style={{ fontSize: 13, color: 'var(--slate-2)', marginTop: 4 }}>
                    {teamList.filter(([, t]) => t.round2.status !== "not-submitted").length} submission(s) received
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowR2SubmissionsModal(false); setActivePreviewReel(null); }}>Close</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexDirection: activePreviewReel ? 'row' : 'column' }}>
                <div style={{ flex: 1, maxHeight: '60vh', overflowY: 'auto' }}>
                  {teamList.length === 0 ? (
                    <p style={{ color: 'var(--slate-2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No submissions yet.</p>
                  ) : (
                    <div className="stack" style={{ gap: '12px' }}>
                      {teamList.map(([tName, tInfo]) => {
                        const hasSubmitted = tInfo.round2.status !== "not-submitted";
                        return (
                          <div 
                            key={tName} 
                            style={{ 
                              border: "1px solid var(--line)", 
                              borderRadius: 10, 
                              padding: 14, 
                              background: activePreviewReel === tInfo.round2.link ? "#f0f4ff" : "#fdfdfd",
                              borderColor: activePreviewReel === tInfo.round2.link ? "#3b82f6" : "var(--line)",
                              cursor: hasSubmitted ? "pointer" : "default"
                            }}
                            onClick={() => {
                              if (hasSubmitted && tInfo.round2.link) {
                                setActivePreviewReel(tInfo.round2.link);
                              }
                            }}
                          >
                            <div className="row-between" style={{ marginBottom: 8 }}>
                              <div>
                                <strong style={{ fontSize: 14, color: "var(--navy)" }}>{tName}</strong>
                                {!tName.startsWith("Individual:") && (
                                  <span style={{ fontSize: 12, color: "var(--slate-2)", marginLeft: 8 }}>
                                    ({tInfo.members.length} members)
                                  </span>
                                )}
                              </div>
                              <StatusBadge status={tInfo.round2.status} />
                            </div>

                            {!tName.startsWith("Individual:") && (
                              <div style={{ fontSize: 11.5, color: "var(--slate-2)", marginBottom: 8 }}>
                                {tInfo.members.join(", ")}
                              </div>
                            )}

                            {hasSubmitted && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                                <div style={{ fontSize: 12, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                  🔗 <a href={tInfo.round2.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--coral)', textDecoration: 'none' }}>{tInfo.round2.link}</a>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {tInfo.round2.juryScore !== null ? (
                                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>Score: {tInfo.round2.juryScore}/10</span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>Pending score</span>
                                  )}
                                  <span style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 'bold' }}>
                                    {activePreviewReel === tInfo.round2.link ? "Watching 👁️" : "Preview →"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {tInfo.round2.note && (
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                                Note: "{tInfo.round2.note}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {activePreviewReel && (
                  <div style={{ flex: 1, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="row-between" style={{ marginBottom: 10 }}>
                      <strong style={{ fontSize: 14 }}>Reel Preview</strong>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--coral)' }} onClick={() => setActivePreviewReel(null)}>Close Preview</button>
                    </div>
                    {renderVideoEmbed(activePreviewReel)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
