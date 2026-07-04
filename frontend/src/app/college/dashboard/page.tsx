"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, Student, Judge, StatusBadge, initials } from "@/context/StateContext";
import * as XLSX from "xlsx";

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
    slotInfo, studentTotal
  } = useStateContext();

  const [collegeTab, setCollegeTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string | null>(null);
  const [teamFormationSlot, setTeamFormationSlot] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamStudents, setSelectedTeamStudents] = useState<Set<string>>(new Set());

  const [judgeToRemove, setJudgeToRemove] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [bulkRemoveConfirm, setBulkRemoveConfirm] = useState(false);

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
        teamName: null,
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
                  teamName: null,
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
    addToast(nextVal ? "Gaplytiq has been notified to upload your groups." : "Request withdrawn.", "success");
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

  const handleFlagOffRound = (roundKey: string) => {
    setRounds({ ...rounds, [roundKey]: "live" });
    if (roundKey === "round1") {
      setStudents(students.map(s => ({ ...s, round1Status: "in-progress" })));
    }
    addToast("Students can now begin " + roundKey.replace("round", "Round "), "success", "Round flagged off — ");
  };

  const handleCloseRound = (roundKey: string) => {
    setRounds({ ...rounds, [roundKey]: "closed" });
    addToast(roundKey.replace("round", "Round ") + " is now closed for submissions.", "success");
  };

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
            <div className="mark">M</div>
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <div className="side-portal-tag">College Admin</div>
          <div className="side-nav">
            <div className={`side-link ${collegeTab === "overview" ? "active" : ""}`} onClick={() => { setCollegeTab("overview"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Overview</span>
            </div>
            <div className={`side-link ${collegeTab === "groups" ? "active" : ""}`} onClick={() => { setCollegeTab("groups"); setSelectedSlotFilter(null); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Manage Students</span>
            </div>
            <div className={`side-link ${collegeTab === "judges" ? "active" : ""}`} onClick={() => { setCollegeTab("judges"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Appoint Judges</span>
            </div>
            <div className={`side-link ${collegeTab === "rounds" ? "active" : ""}`} onClick={() => { setCollegeTab("rounds"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round Control</span>
            </div>
            <div className={`side-link ${collegeTab === "dashboard" ? "active" : ""}`} onClick={() => { setCollegeTab("dashboard"); setIsMobileSidebarOpen(false); }} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Live Dashboard</span>
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
                  {collegeTab === "groups" && "Manage Students"}
                  {collegeTab === "judges" && "Appoint Judges"}
                {collegeTab === "rounds" && "Round Control"}
                {collegeTab === "dashboard" && "Live Dashboard"}
              </h2>
              <div className="sub">
                {collegeTab === "overview" && "Everything happening across MarkUp, in real time"}
                {collegeTab === "groups" && "Upload students via Excel, or let Gaplytiq handle it for you"}
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
                  <div className="card stat-card">
                    <div className="label">Round 2 submitted</div>
                    <div className="value">{students.filter(s => s.round2.status !== "not-submitted").length}/{students.length}</div>
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
                      <div className="row-between" style={{ fontSize: 13, padding: "10px 12px", background: "#fdfdfd", border: "1px solid var(--line)", borderRadius: 8 }}>
                        <span>3:00 PM – 4:00 PM</span>
                        <strong style={{ fontSize: 13, color: "var(--coral)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { setTeamFormationSlot("S1"); setCollegeTab("teams"); }}>
                          {students.filter(s => s.slotId === "S1").length} students <span>→</span>
                        </strong>
                      </div>
                      <div className="row-between" style={{ fontSize: 13, padding: "10px 12px", background: "#fdfdfd", border: "1px solid var(--line)", borderRadius: 8 }}>
                        <span>5:00 PM – 6:00 PM</span>
                        <strong style={{ fontSize: 13, color: "var(--coral)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { setTeamFormationSlot("S2"); setCollegeTab("teams"); }}>
                          {students.filter(s => s.slotId === "S2").length} students <span>→</span>
                        </strong>
                      </div>
                      <div className="row-between" style={{ fontSize: 13, padding: "10px 12px", background: "#fdfdfd", border: "1px solid var(--line)", borderRadius: 8 }}>
                        <span>7:00 PM – 8:00 PM</span>
                        <strong style={{ fontSize: 13, color: "var(--coral)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { setTeamFormationSlot("S3"); setCollegeTab("teams"); }}>
                          {students.filter(s => s.slotId === "S3").length} students <span>→</span>
                        </strong>
                      </div>
                      <div className="row-between" style={{ fontSize: 12, color: "var(--slate-2)", padding: "4px 8px" }}>
                        <span>Unassigned / Pending</span>
                        <span>{students.filter(s => !s.slotId).length} students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- MANAGE STUDENTS --- */}
            {collegeTab === "groups" && (
              <>
                <div className="grid grid-2">
                  <div className="card card-pad">
                    <div className="section-title">Add a student manually</div>
                    <div className="section-desc">Phone numbers are how students will sign in with OTP.</div>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input className="input" placeholder="e.g. Aarav Sharma" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input className="input" placeholder="student@example.com" value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} />
                    </div>
                    <div className="form-group">
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
              const unassigned = slotStudents.filter(s => !s.teamName);
              
              // Group assigned students by teamName
              const teamsMap: Record<string, typeof slotStudents> = {};
              slotStudents.forEach(s => {
                if (s.teamName) {
                  if (!teamsMap[s.teamName]) teamsMap[s.teamName] = [];
                  teamsMap[s.teamName].push(s);
                }
              });

              const handleCreateTeam = async () => {
                if (!newTeamName.trim()) {
                  addToast("Team name is required.", "error");
                  return;
                }
                const studentIds = Array.from(selectedTeamStudents);
                if (studentIds.length === 0) {
                  addToast("Please select at least one student.", "error");
                  return;
                }

                setIsProcessing(true);
                try {
                  const res = await fetch("http://localhost:3001/api/students/assign-team", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentIds, teamName: newTeamName.trim() })
                  });
                  const json = await res.json();
                  if (!json.success) throw new Error(json.error);

                  // Update local state
                  setStudents(prev => prev.map(s => {
                    if (studentIds.includes(s.id)) {
                      return { ...s, teamName: newTeamName.trim() };
                    }
                    return s;
                  }));

                  setNewTeamName("");
                  setSelectedTeamStudents(new Set());
                  addToast(`Team "${newTeamName}" created successfully!`, "success");
                } catch (err: any) {
                  addToast("Failed to create team: " + err.message, "error");
                } finally {
                  setIsProcessing(false);
                }
              };

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
                      return { ...s, teamName: null };
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

              const toggleTeamStudent = (id: string) => {
                setSelectedTeamStudents(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              };

              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <button className="btn btn-ghost" style={{ paddingLeft: 0, color: "var(--coral)", fontWeight: "bold" }} onClick={() => setCollegeTab("overview")}>
                      ← Back to Overview
                    </button>
                  </div>

                  <div className="grid grid-2">
                    {/* Left: Create Team Form */}
                    <div className="card card-pad">
                      <div className="section-title">Create Team for Slot</div>
                      <div className="section-desc">Select students in {slotLabel} to group them.</div>
                      
                      <div className="form-group" style={{ marginTop: 12 }}>
                        <label>Team Name</label>
                        <input 
                          className="input" 
                          placeholder="e.g. Team Alpha" 
                          value={newTeamName} 
                          onChange={(e) => setNewTeamName(e.target.value)}
                        />
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: "bold", color: "var(--slate-2)", display: "block", marginBottom: 8 }}>
                          Select Students ({unassigned.length} available)
                        </label>
                        {unassigned.length === 0 ? (
                          <div style={{ fontSize: 13, color: "var(--slate-2)", padding: "12px 0" }}>
                            No unassigned students in this slot.
                          </div>
                        ) : (
                          <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
                            {unassigned.map(s => (
                              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: 13 }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedTeamStudents.has(s.id)} 
                                  onChange={() => toggleTeamStudent(s.id)}
                                />
                                <span>{s.name} <span style={{ color: "var(--slate-2)", fontSize: 11 }}>({s.email})</span></span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn btn-coral btn-block" 
                        style={{ marginTop: 20 }} 
                        disabled={isProcessing || unassigned.length === 0}
                        onClick={handleCreateTeam}
                      >
                        {isProcessing ? "Processing..." : "Create Team"}
                      </button>
                    </div>

                    {/* Right: Existing Teams */}
                    <div className="card card-pad">
                      <div className="section-title">Existing Teams</div>
                      <div className="section-desc">Teams currently registered in {slotLabel}.</div>

                      <div className="stack" style={{ marginTop: 16 }}>
                        {Object.keys(teamsMap).length === 0 ? (
                          <div style={{ padding: "30px 0", textAlign: "center", color: "var(--slate-2)", fontSize: 14 }}>
                            No teams formed yet.
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
                  <div className="form-group">
                    <label>Full name</label>
                    <input className="input" placeholder="Dr. Full Name" value={newJudgeName} onChange={(e) => setNewJudgeName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="input" placeholder="name@alliance.edu.in" value={newJudgeEmail} onChange={(e) => setNewJudgeEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
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
                  { key: "round2", title: "Round 2 · 90-Sec Reel", desc: "Groups can upload their Reel/Short for jury review once this round is live." },
                  { key: "round3", title: "Round 3 · Demo Day Film", desc: "Groups co-create and submit their 60-second film with Gaplytiq, then upload here." },
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
                        <button className="btn btn-ghost btn-block" disabled>Round closed</button>
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
                    <div className="value">{students.filter(s => s.round2.status !== "not-submitted").length}/{students.length}</div>
                    <div className="delta">students</div>
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
                    <button className="btn btn-ghost btn-sm" onClick={() => addToast("Live dashboard exported as CSV (demo).", "success", "Exported ")}>⬇ Export CSV</button>
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
                          <th>Cumulative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...students]
                          .map(s => ({ s, total: studentTotal(s) }))
                          .sort((a, b) => b.total - a.total)
                          .map((r, i) => (
                            <tr key={r.s.id}>
                              <td><b>#{i + 1}</b></td>
                              <td>
                                <b>{r.s.name}</b>
                                <div style={{ fontSize: 11, color: "var(--slate-2)" }}>{r.s.college}</div>
                              </td>
                              <td>{r.s.r1Score !== null ? "Tested" : "—"}</td>
                              <td>{r.s.r1Score !== null ? r.s.r1Score.toFixed(1) : "—"}</td>
                              <td><StatusBadge status={r.s.round2.status} /></td>
                              <td><StatusBadge status={r.s.round3.status} /></td>
                              <td><b>{r.total.toFixed(1)}</b></td>
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

    </div>
  );
}
