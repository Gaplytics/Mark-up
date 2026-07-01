"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, StatusBadge, initials } from "@/context/StateContext";

export default function JuryDashboardPage() {
  const router = useRouter();
  const { groups, setGroups, currentJury, setCurrentJury, addToast, groupRound1Avg } = useStateContext();
  
  const [juryTab, setJuryTab] = useState("overview");
  const [juryScores, setJuryScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentJury) {
      router.replace("/jury/login");
    }
  }, [currentJury, router]);

  if (!currentJury) return null;

  const handleJurySubmissionAction = (gid: string, roundKey: "round2" | "round3", status: "approved" | "rejected") => {
    setGroups(groups.map(g => {
      if (g.id === gid) {
        return {
          ...g,
          [roundKey]: { ...g[roundKey], status },
        };
      }
      return g;
    }));
    const targetGroup = groups.find(g => g.id === gid);
    addToast((targetGroup?.name || "Group") + "'s submission marked " + (status === "approved" ? "approved" : "needs changes") + ".", status === "approved" ? "success" : "error");
  };

  const handleJuryScoreSave = (gid: string, roundKey: "round2" | "round3") => {
    const val = juryScores[`${gid}-${roundKey}`];
    if (val === undefined || isNaN(val) || val < 0 || val > 10) {
      addToast("Enter a score between 0 and 10.", "error", "Invalid score — ");
      return;
    }
    setGroups(groups.map(g => {
      if (g.id === gid) {
        return {
          ...g,
          [roundKey]: { ...g[roundKey], juryScore: val },
        };
      }
      return g;
    }));
    const targetGroup = groups.find(g => g.id === gid);
    addToast("Score saved for " + (targetGroup?.name || "group") + ".", "success");
  };

  const handleLogout = () => {
    setCurrentJury(null);
    router.push("/");
  };

  return (
    <div id="screen-jury-app">
      <div className="app-shell">
        {/* Sidebar */}
        <div className="sidebar">
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
                {juryTab === "overview" && "Your assigned groups and pending reviews"}
                {juryTab === "round1" && "Auto-scored from the individual test — view only"}
                {juryTab === "round2" && "Review and approve each group's 90-second Reel"}
                {juryTab === "round3" && "Review and score each group's live campaign film"}
              </div>
            </div>
          </div>

          <div className="content">
            {/* --- OVERVIEW --- */}
            {juryTab === "overview" && (
              <>
                <div className="grid grid-3" style={{ marginBottom: 20 }}>
                  <div className="card stat-card">
                    <div className="label">Groups assigned</div>
                    <div className="value">{groups.length}</div>
                    <div className="delta">across all rounds</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 2 awaiting review</div>
                    <div className="value">{groups.filter(g => g.round2.status === "pending").length}</div>
                    <div className="delta">reels pending</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 3 awaiting review</div>
                    <div className="value">{groups.filter(g => g.round3.status === "pending").length}</div>
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
                <div className="section-desc">Scored automatically by the platform. Group score is the average of its 5 members.</div>
                <div className="scrollx">
                  <table>
                    <thead>
                      <tr>
                        <th>Group</th>
                        <th>Members tested</th>
                        <th>Average score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(g => {
                        const avg = groupRound1Avg(g);
                        const done = g.members.filter(m => m.r1Score !== null).length;
                        return (
                          <tr key={g.id}>
                            <td><b>{g.name}</b></td>
                            <td>{done}/5</td>
                            <td>{avg !== null ? avg.toFixed(1) + " / 5.0" : "—"}</td>
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
                {groups.map(g => {
                  const roundKey = juryTab as "round2" | "round3";
                  const r = g[roundKey];
                  const label = roundKey === "round2" ? "90-Sec Reel" : "60-Sec Demo Day Film";
                  return (
                    <div key={g.id} className="card card-pad">
                      <div className="row-between">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{g.name}</div>
                          <div style={{ fontSize: 12, color: "var(--slate-2)", marginTop: 2 }}>{label} · {g.members.length} members</div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      {r.status === "not-submitted" ? (
                        <p style={{ fontSize: 12.5, color: "var(--slate-2)", marginTop: 14 }}>Waiting for this group to submit.</p>
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
                                value={juryScores[`${g.id}-${roundKey}`] ?? r.juryScore ?? ""}
                                onChange={(e) => setJuryScores({ ...juryScores, [`${g.id}-${roundKey}`]: parseFloat(e.target.value) })}
                                placeholder="e.g. 8"
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleJuryScoreSave(g.id, roundKey)}>Save score</button>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button className="btn btn-outline-coral btn-sm" onClick={() => handleJurySubmissionAction(g.id, roundKey, "approved")}>✓ Approve submission</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleJurySubmissionAction(g.id, roundKey, "rejected")}>Request changes</button>
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
