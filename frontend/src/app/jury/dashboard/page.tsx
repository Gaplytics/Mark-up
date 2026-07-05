"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, StatusBadge, initials } from "@/context/StateContext";

const renderVideoEmbed = (link: string) => {
  if (!link) return null;
  
  // YouTube embed
  const ytMatch = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?.*v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <iframe 
        width="100%" 
        height="315" 
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
        height="315" 
        allow="autoplay"
        style={{ borderRadius: "8px", marginTop: "12px", border: "none" }}
      ></iframe>
    );
  }
  
  // Direct MP4
  if (link.toLowerCase().endsWith('.mp4')) {
    return (
      <video width="100%" height="315" controls style={{ borderRadius: "8px", marginTop: "12px", background: "#000" }}>
        <source src={link} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
  
  // Fallback for unknown links
  return (
    <div style={{ marginTop: "12px", padding: "16px", background: "#f8f9fc", borderRadius: "8px", textAlign: "center", border: "1px dashed var(--line)" }}>
      <p style={{ fontSize: "13px", color: "var(--slate-2)", marginBottom: "8px" }}>This link format cannot be embedded directly.</p>
      <a href={link} target="_blank" rel="noreferrer" className="btn btn-outline-coral btn-sm">Open Video in New Tab ↗</a>
    </div>
  );
};

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--navy)" }}>{label} ({value > 0 ? `${value}/10` : "—"})</div>
      <div style={{ display: "flex", gap: "6px" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
          const active = star <= value;
          return (
            <span
              key={star}
              onClick={() => onChange(star)}
              style={{
                cursor: "pointer",
                fontSize: "22px",
                color: active ? "#FFC107" : "#E2E8F0",
                transition: "color 0.15s ease, transform 0.1s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1.0)";
              }}
            >
              ★
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default function JuryDashboardPage() {
  const router = useRouter();
  const { students, setStudents, currentJury, setCurrentJury, addToast } = useStateContext();
  
  const [juryTab, setJuryTab] = useState("overview");
  const [juryScores, setJuryScores] = useState<Record<string, number>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [subScores, setSubScores] = useState<Record<string, { clarity?: number; creativity?: number; thought?: number }>>({});

  useEffect(() => {
    setCandidateIndex(0);
  }, [juryTab]);

  const getSubScore = (sid: string, criteria: "clarity" | "creativity" | "thought") => {
    const roundKey = juryTab as "round2" | "round3";
    const key = `${sid}-${roundKey}`;
    const savedVal = subScores[key]?.[criteria];
    if (savedVal !== undefined) return savedVal;
    
    // Default to the overall juryScore if it exists
    const student = students.find(s => s.id === sid);
    const existingOverall = student?.[roundKey]?.juryScore;
    if (existingOverall !== null && existingOverall !== undefined) {
      return Math.round(existingOverall);
    }
    return 0;
  };

  useEffect(() => {
    if (!currentJury) {
      router.replace("/jury/login");
    }
  }, [currentJury, router]);

  if (!currentJury) return null;

  const handleJurySubmissionAction = (sid: string, roundKey: "round2" | "round3", status: "approved" | "rejected") => {
    // Sync to Supabase
    fetch(`http://localhost:3001/api/students/${sid}/jury-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundKey, status })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        addToast("Failed to sync submission status to server.", "error");
      }
    })
    .catch(err => {
      console.error("Error updating submission status:", err);
      addToast("Failed to sync submission status to server.", "error");
    });

    setStudents(students.map(s => {
      if (s.id === sid) {
        return {
          ...s,
          [roundKey]: { ...s[roundKey], status },
        };
      }
      return s;
    }));
    const targetStudent = students.find(s => s.id === sid);
    addToast((targetStudent?.name || "Student") + "'s submission marked " + (status === "approved" ? "approved" : "needs changes") + ".", status === "approved" ? "success" : "error");
  };

  const handleJuryScoreSave = (sid: string, roundKey: "round2" | "round3") => {
    const val = juryScores[`${sid}-${roundKey}`];
    if (val === undefined || isNaN(val) || val < 0 || val > 10) {
      addToast("Enter a score between 0 and 10.", "error", "Invalid score — ");
      return;
    }

    // Sync to Supabase
    fetch(`http://localhost:3001/api/students/${sid}/jury-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundKey, score: val })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        addToast("Failed to sync score to server.", "error");
      }
    })
    .catch(err => {
      console.error("Error updating jury score:", err);
      addToast("Failed to sync score to server.", "error");
    });

    setStudents(students.map(s => {
      if (s.id === sid) {
        return {
          ...s,
          [roundKey]: { ...s[roundKey], juryScore: val },
        };
      }
      return s;
    }));
    const targetStudent = students.find(s => s.id === sid);
    addToast("Score saved for " + (targetStudent?.name || "student") + ".", "success");
  };

  const handleLogout = () => {
    setCurrentJury(null);
    router.push("/");
  };

  return (
    <div id="screen-jury-app">
      <div className="app-shell">
        {/* Sidebar */}
        <div className={`sidebar ${!isSidebarOpen ? "collapsed" : ""}`}>
          <div style={{ display: "flex", justifyContent: isSidebarOpen ? "flex-end" : "center", marginBottom: 16 }}>
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
          <div className="side-portal-tag">Jury Panel</div>
          <div className="side-nav">
            <div className={`side-link ${juryTab === "overview" ? "active" : ""}`} onClick={() => setJuryTab("overview")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span className="lbl">Overview</span>
            </div>
            <div className={`side-link ${juryTab === "round1" ? "active" : ""}`} onClick={() => setJuryTab("round1")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span className="lbl">Round 1 Scores</span>
            </div>
            <div className={`side-link ${juryTab === "round2" ? "active" : ""}`} onClick={() => setJuryTab("round2")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path></svg>
              <span className="lbl">Round 2 Reels</span>
            </div>
            <div className={`side-link ${juryTab === "round3" ? "active" : ""}`} onClick={() => setJuryTab("round3")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              <span className="lbl">Round 3 Demo Day</span>
            </div>
          </div>
          <div className="side-foot">
            <div className="side-user">
              <div className="avatar">{initials(currentJury.name)}</div>
              <div>
                <div className="u-name">{currentJury.name}</div>
                <div className="u-role">SOB Faculty Jury</div>
              </div>
            </div>
            <div className="side-link" onClick={handleLogout} style={{ marginTop: 6, cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Log out</span>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="main">
          <div className="topbar">
            <div>
              <h2>
                {juryTab === "overview" && "Overview"}
                {juryTab === "round1" && "Round 1 Scores"}
                {juryTab === "round2" && "Round 2 Reels"}
                {juryTab === "round3" && "Round 3 Demo Day"}
              </h2>
                <div className="sub">
                  {juryTab === "overview" && "Your assigned students and pending reviews"}
                  {juryTab === "round1" && "Auto-scored from the individual test — view only"}
                  {juryTab === "round2" && "Review and approve each student's 90-second Reel"}
                  {juryTab === "round3" && "Review and score each student's live campaign film"}
                </div>
              </div>
          </div>

          <div className="content">
            {/* --- OVERVIEW --- */}
            {juryTab === "overview" && (
              <>
                <div className="grid grid-3" style={{ marginBottom: 20 }}>
                  <div className="card stat-card">
                    <div className="label">Students assigned</div>
                    <div className="value">{students.length}</div>
                    <div className="delta">across all rounds</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 2 awaiting review</div>
                    <div className="value">{students.filter(s => s.round2.status === "pending" && s.round2.juryScore === null).length}</div>
                    <div className="delta">reels pending</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 3 awaiting review</div>
                    <div className="value">{students.filter(s => s.round3.status === "pending" && s.round3.juryScore === null).length}</div>
                    <div className="delta">films pending</div>
                  </div>
                </div>
                <div className="card card-pad">
                  <div className="section-title">Quick actions</div>
                  <div className="section-desc">Jump straight to what needs your attention.</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="btn btn-coral" onClick={() => setJuryTab("round2")}>Review Round 2 reels →</button>
                    <button className="btn btn-ghost" onClick={() => setJuryTab("round3")}>Review Round 3 films →</button>
                    <button className="btn btn-ghost" onClick={() => setJuryTab("round1")}>View Round 1 scores →</button>
                  </div>
                </div>
              </>
            )}

            {/* --- ROUND 1 SCORES --- */}
            {juryTab === "round1" && (
              <div className="card card-pad">
                <div className="section-title">Round 1 — Individual test scores</div>
                <div className="section-desc">Scored automatically by the platform. View only.</div>
                <div className="scrollx">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>College</th>
                        <th>Test Status</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        return (
                          <tr key={s.id}>
                            <td><b>{s.name}</b></td>
                            <td>{s.college}</td>
                            <td>{s.r1Score !== null ? "Tested" : "Pending"}</td>
                            <td>{s.r1Score !== null ? s.r1Score.toFixed(1) + " / 10.0" : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- ROUND 2 / 3 --- */}
            {(juryTab === "round2" || juryTab === "round3") && (() => {
              const roundKey = juryTab as "round2" | "round3";
              const label = roundKey === "round2" ? "90-Sec Reel" : "60-Sec Demo Day Film";
              
              // Filter to show only candidates who have submitted
              const submittedCandidates = students.filter(s => s[roundKey]?.status !== "not-submitted");
              
              if (submittedCandidates.length === 0) {
                return (
                  <div className="card card-pad" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--navy)" }}>No submissions yet</div>
                    <p style={{ color: "var(--slate-2)", fontSize: "13px", marginTop: "4px" }}>Students will appear here once they upload their video link.</p>
                  </div>
                );
              }

              const allReviewed = submittedCandidates.every(s => s[roundKey]?.juryScore !== null);
              if (allReviewed) {
                return (
                  <div className="card card-pad" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎉</div>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--navy)" }}>All caught up!</div>
                    <p style={{ color: "var(--slate-2)", fontSize: "13.5px", marginTop: "4px" }}>For now all the submitted reels have been reviewed.</p>
                  </div>
                );
              }
              
              // Safe index clamping
              const safeIndex = candidateIndex >= submittedCandidates.length ? 0 : candidateIndex;
              const s = submittedCandidates[safeIndex];
              const r = s[roundKey];
              
              // Calculate real-time average
              const clarity = getSubScore(s.id, "clarity");
              const creativity = getSubScore(s.id, "creativity");
              const thought = getSubScore(s.id, "thought");
              
              const hasAllScores = clarity > 0 && creativity > 0 && thought > 0;
              const averageScore = hasAllScores ? parseFloat(((clarity + creativity + thought) / 3).toFixed(1)) : 0;
              
              const handlePrev = () => {
                if (safeIndex > 0) setCandidateIndex(safeIndex - 1);
              };
              
              const handleNext = () => {
                if (safeIndex < submittedCandidates.length - 1) setCandidateIndex(safeIndex + 1);
              };
              
              const saveAndNext = async () => {
                if (!hasAllScores) {
                  addToast("Please grade all three criteria (Clarity, Creativity, Thought) before saving.", "error");
                  return;
                }
                
                try {
                  const res = await fetch(`http://localhost:3001/api/students/${s.id}/jury-review`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roundKey, score: averageScore, status: "approved" })
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.error);
                  
                  // Update local state
                  setStudents(students.map(item => {
                    if (item.id === s.id) {
                      return {
                        ...item,
                        [roundKey]: { ...item[roundKey], juryScore: averageScore, status: "approved" }
                      };
                    }
                    return item;
                  }));
                  
                  addToast(`Average score of ${averageScore} saved for ${s.name}!`, "success");
                  
                  // Automatically proceed to next candidate if available
                  if (safeIndex < submittedCandidates.length - 1) {
                    setCandidateIndex(safeIndex + 1);
                  } else {
                     addToast("You have reached the end of the submissions list.");
                  }
                } catch (err) {
                  console.error(err);
                  addToast("Failed to save score.", "error");
                }
              };
              
              return (
                <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                  {/* Navigation controls at top */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", background: "#fff", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={safeIndex === 0} style={{ padding: "6px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                      ← Prev Candidate
                    </button>
                    <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--navy)" }}>
                      Candidate {safeIndex + 1} of {submittedCandidates.length}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={handleNext} disabled={safeIndex === submittedCandidates.length - 1} style={{ padding: "6px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                      Next Candidate →
                    </button>
                  </div>
                  
                  <div className="card card-pad">
                    <div className="row-between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--navy)" }}>{s.name}</div>
                        <div style={{ fontSize: "12.5px", color: "var(--slate-2)", marginTop: 2 }}>{label} · {s.college}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    
                    <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--navy)" }}>Submission Video</div>
                        {r.link && (
                          <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--coral)", textDecoration: "none" }}>Open in new tab ↗</a>
                        )}
                      </div>
                      
                      {r.link ? renderVideoEmbed(r.link) : <div style={{ fontSize: "13px", color: "var(--slate-2)", fontStyle: "italic", marginTop: 8 }}>No link provided</div>}
                      
                      {r.note && (
                        <div style={{ fontSize: "12.5px", color: "var(--slate-2)", marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                          <b>Note to Jury:</b> {r.note}
                        </div>
                      )}
                    </div>
                    
                    {/* Star scoring criteria */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "20px", marginBottom: "20px" }}>
                      <StarRating 
                        label="Clarity" 
                        value={clarity} 
                        onChange={(val) => setSubScores(prev => ({
                          ...prev,
                          [`${s.id}-${roundKey}`]: { ...prev[`${s.id}-${roundKey}`], clarity: val }
                        }))} 
                      />
                      
                      <StarRating 
                        label="Creativity" 
                        value={creativity} 
                        onChange={(val) => setSubScores(prev => ({
                          ...prev,
                          [`${s.id}-${roundKey}`]: { ...prev[`${s.id}-${roundKey}`], creativity: val }
                        }))} 
                      />
                      
                      <StarRating 
                        label="Thought" 
                        value={thought} 
                        onChange={(val) => setSubScores(prev => ({
                          ...prev,
                          [`${s.id}-${roundKey}`]: { ...prev[`${s.id}-${roundKey}`], thought: val }
                        }))} 
                      />
                    </div>
                    
                    {/* Real-time average display */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#f8f9fc", padding: "14px", borderRadius: "8px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--navy)" }}>Average Score</div>
                        <div style={{ fontSize: "12px", color: "var(--slate-2)" }}>Calculated automatically from criteria above</div>
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "800", color: averageScore > 0 ? "var(--coral)" : "#a0aec0" }}>
                        {averageScore > 0 ? `${averageScore} / 10` : "—"}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button className="btn btn-outline-coral btn-sm" onClick={() => handleJurySubmissionAction(s.id, roundKey, "approved")}>✓ Approve</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleJurySubmissionAction(s.id, roundKey, "rejected")}>Request Changes</button>
                      <button className="btn btn-coral btn-sm" onClick={saveAndNext} disabled={!hasAllScores}>
                        Save & Next →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
