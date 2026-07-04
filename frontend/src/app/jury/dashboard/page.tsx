"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, StatusBadge, initials } from "@/context/StateContext";

export default function JuryDashboardPage() {
  const router = useRouter();
  const { students, setStudents, currentJury, setCurrentJury, addToast } = useStateContext();
  
  const [juryTab, setJuryTab] = useState("overview");
  const [juryScores, setJuryScores] = useState<Record<string, number>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!currentJury) {
      router.replace("/jury/login");
    }
  }, [currentJury, router]);

  if (!currentJury) return null;

  const handleJurySubmissionAction = (sid: string, roundKey: "round2" | "round3", status: "approved" | "rejected") => {
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
            <div className="mark">M</div>
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <div className="side-portal-tag">Jury Panel</div>
          <div className="side-nav">
            <div className={`side-link ${juryTab === "overview" ? "active" : ""}`} onClick={() => setJuryTab("overview")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Overview</span>
            </div>
            <div className={`side-link ${juryTab === "round1" ? "active" : ""}`} onClick={() => setJuryTab("round1")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 1 Scores</span>
            </div>
            <div className={`side-link ${juryTab === "round2" ? "active" : ""}`} onClick={() => setJuryTab("round2")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 2 Reels</span>
            </div>
            <div className={`side-link ${juryTab === "round3" ? "active" : ""}`} onClick={() => setJuryTab("round3")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 3 Demo Day</span>
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
                    <div className="value">{students.filter(s => s.round2.status === "pending").length}</div>
                    <div className="delta">reels pending</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 3 awaiting review</div>
                    <div className="value">{students.filter(s => s.round3.status === "pending").length}</div>
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
            {(juryTab === "round2" || juryTab === "round3") && (
              <div className="grid" style={{ gap: 14 }}>
                {students.map(s => {
                  const roundKey = juryTab as "round2" | "round3";
                  const r = s[roundKey];
                  const label = roundKey === "round2" ? "90-Sec Reel" : "60-Sec Demo Day Film";
                  return (
                    <div key={s.id} className="card card-pad">
                      <div className="row-between">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: "var(--slate-2)", marginTop: 2 }}>{label} · {s.college}</div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      {r.status === "not-submitted" ? (
                        <p style={{ fontSize: 12.5, color: "var(--slate-2)", marginTop: 14 }}>Waiting for this student to submit.</p>
                      ) : (
                        <>
                          <div style={{ marginTop: 14, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA" }}>
                            <div style={{ fontSize: 12.5 }}>
                              🔗 <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--navy-2)", fontWeight: 600 }}>{r.link || "submission-link.mp4"}</a>
                            </div>
                            {r.note && (
                              <div style={{ fontSize: 12, color: "var(--slate-2)", marginTop: 6 }}>Note: {r.note}</div>
                            )}
                          </div>
                          <div className="form-row" style={{ marginTop: 14 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Score (out of 10)</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                max="10"
                                value={juryScores[`${s.id}-${roundKey}`] ?? r.juryScore ?? ""}
                                onChange={(e) => setJuryScores({ ...juryScores, [`${s.id}-${roundKey}`]: parseFloat(e.target.value) })}
                                placeholder="e.g. 8"
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleJuryScoreSave(s.id, roundKey)}>Save score</button>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button className="btn btn-outline-coral btn-sm" onClick={() => handleJurySubmissionAction(s.id, roundKey, "approved")}>✓ Approve submission</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleJurySubmissionAction(s.id, roundKey, "rejected")}>Request changes</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
