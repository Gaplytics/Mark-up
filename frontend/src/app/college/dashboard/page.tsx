"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, Member, Group, Judge, StatusBadge, initials } from "@/context/StateContext";

export default function CollegeDashboardPage() {
  const router = useRouter();
  const {
    collegeAdminName,
    collegeAdminId,
    groups, setGroups,
    judges, setJudges,
    slots,
    rounds, setRounds,
    gaplytiqUploadRequested, setGaplytiqUploadRequested,
    addToast,
    slotInfo, groupRound1Avg, groupTotal
  } = useStateContext();

  const [collegeTab, setCollegeTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      addToast("Enter a group name first.", "error", "Missing info — ");
      return;
    }
    if (newGroupMembers.some(m => !m.name.trim() || !m.phone.trim())) {
      addToast("All 5 members need a name and phone number.", "error", "Missing info — ");
      return;
    }
    const membersList: Member[] = newGroupMembers.map(m => ({
      name: m.name.trim(),
      phone: m.phone.trim(),
      r1Score: null,
    }));
    const slot = slots[groups.length % slots.length];
    const newGroup: Group = {
      id: "G" + (groups.length + 1),
      name: newGroupName.trim(),
      college: collegeAdminName,
      members: membersList,
      slotId: slot.id,
      round1Status: "not-started",
      round2: { status: "not-submitted", link: "", note: "", juryScore: null },
      round3: { status: "not-submitted", link: "", note: "", juryScore: null },
    };
    setGroups([...groups, newGroup]);
    addToast(newGroupName + " added with 5 members, assigned to " + slot.label + ".", "success", "Group added — ");
    setNewGroupName("");
    setNewGroupMembers([
      { name: "", phone: "" },
      { name: "", phone: "" },
      { name: "", phone: "" },
      { name: "", phone: "" },
      { name: "", phone: "" },
    ]);
    setCollegeTab("groups");
  };

  const handleRemoveGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    addToast("Group removed.", "success");
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

  const handleRemoveJudge = (id: string) => {
    setJudges(judges.filter(j => j.id !== id));
    addToast("Judge removed from panel.", "success");
  };

  const handleFlagOffRound = (roundKey: string) => {
    setRounds({ ...rounds, [roundKey]: "live" });
    if (roundKey === "round1") {
      setGroups(groups.map(g => ({ ...g, round1Status: "in-progress" })));
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
          <div className="side-portal-tag">College Admin</div>
          <div className="side-nav">
            <div className={`side-link ${collegeTab === "overview" ? "active" : ""}`} onClick={() => setCollegeTab("overview")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Overview</span>
            </div>
            <div className={`side-link ${collegeTab === "groups" ? "active" : ""}`} onClick={() => setCollegeTab("groups")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Manage Groups</span>
            </div>
            <div className={`side-link ${collegeTab === "judges" ? "active" : ""}`} onClick={() => setCollegeTab("judges")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Appoint Judges</span>
            </div>
            <div className={`side-link ${collegeTab === "rounds" ? "active" : ""}`} onClick={() => setCollegeTab("rounds")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round Control</span>
            </div>
            <div className={`side-link ${collegeTab === "dashboard" ? "active" : ""}`} onClick={() => setCollegeTab("dashboard")} style={{ cursor: "pointer" }}>
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
            <div>
              <h2>
                {collegeTab === "overview" && "Overview"}
                {collegeTab === "groups" && "Manage Groups"}
                {collegeTab === "judges" && "Appoint Judges"}
                {collegeTab === "rounds" && "Round Control"}
                {collegeTab === "dashboard" && "Live Dashboard"}
              </h2>
              <div className="sub">
                {collegeTab === "overview" && "Everything happening across MarkUp, in real time"}
                {collegeTab === "groups" && "Upload student groups yourself, or ask Gaplytiq to do it for you"}
                {collegeTab === "judges" && "Add School of Business faculty to the jury panel"}
                {collegeTab === "rounds" && "Flag off and close each round when your campus is ready"}
                  {collegeTab === "dashboard" && "Real-time participation and scores, by group"}
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
                    <div className="label">Groups registered</div>
                    <div className="value">{groups.length}</div>
                    <div className="delta">{groups.reduce((a, g) => a + g.members.length, 0)} students total</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Jury appointed</div>
                    <div className="value">{judges.length}</div>
                    <div className="delta">SOB faculty</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 1 complete</div>
                    <div className="value">{groups.filter(g => groupRound1Avg(g) !== null).length}/{groups.length}</div>
                    <div className="delta">groups with a score</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Round 2 submitted</div>
                    <div className="value">{groups.filter(g => g.round2.status !== "not-submitted").length}/{groups.length}</div>
                    <div className="delta">reels received</div>
                  </div>
                </div>

                <div className="grid grid-2">
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
                    <div className="section-title">Group upload status</div>
                    <div className="section-desc">How your group roster was added.</div>
                    <div style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA" }}>
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                        {gaplytiqUploadRequested
                          ? "✅ Gaplytiq has been requested to upload your groups on your behalf."
                          : "You're managing group uploads directly from the Manage Groups tab."}
                      </p>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setCollegeTab("groups")}>Go to Manage Groups →</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- MANAGE GROUPS --- */}
            {collegeTab === "groups" && (
              <>
                <div className="grid grid-2">
                  <div className="card card-pad">
                    <div className="section-title">Add a group manually</div>
                    <div className="section-desc">Each group must have exactly 5 members. Phone numbers are how students will sign in with OTP.</div>
                    <div className="form-group">
                      <label>Group name</label>
                      <input className="input" placeholder="e.g. BrandStorm" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                    </div>
                    <div id="memberFields">
                      {newGroupMembers.map((member, i) => (
                        <div key={i} className="group-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Member {i + 1} name</label>
                            <input
                              className="input"
                              placeholder="Full name"
                              value={member.name}
                              onChange={(e) => {
                                const next = [...newGroupMembers];
                                next[i].name = e.target.value;
                                setNewGroupMembers(next);
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Mobile number</label>
                            <input
                              className="input"
                              placeholder="98XXXXXXXX"
                              value={member.phone}
                              onChange={(e) => {
                                const next = [...newGroupMembers];
                                next[i].phone = e.target.value;
                                setNewGroupMembers(next);
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 11, color: "var(--slate-2)" }}>Used for OTP login</div>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-coral btn-block" onClick={handleAddGroup}>Add group</button>
                  </div>

                  <div className="card card-pad">
                    <div className="section-title">Or, let Gaplytiq handle it</div>
                    <div className="section-desc">Send your roster (Excel / Google Sheet) to Gaplytiq and their team will upload all groups for you.</div>
                    <div className="row-between" style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 10, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>Request Gaplytiq to upload groups</div>
                        <div style={{ fontSize: 12, color: "var(--slate-2)", marginTop: 2 }}>Toggle on to notify the Gaplytiq team</div>
                      </div>
                      <div className={`toggle ${gaplytiqUploadRequested ? "on" : ""}`} onClick={handleToggleGaplytiq} style={{ cursor: "pointer" }}>
                        <div className="knob"></div>
                      </div>
                    </div>
                    <div className="upload-drop">
                      <div className="ico">📤</div>
                      <div className="t">Drop your roster file here</div>
                      <div className="d">.xlsx or .csv — group name, member name, phone</div>
                    </div>

                    <div className="section-title" style={{ marginTop: 22 }}>Slots</div>
                    <div className="section-desc">Gaplytiq assigns 40 students per testing slot, auto-balanced across your groups.</div>
                    <div className="stack">
                      {slots.map(s => {
                        const { filled } = slotInfo(s.id);
                        const pct = Math.min(100, Math.round((filled / s.capacity) * 100));
                        return (
                          <div key={s.id} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 9 }}>
                            <div className="row-between" style={{ marginBottom: 6 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{s.label}</span>
                              <span style={{ fontSize: 11.5, color: "var(--slate-2)" }}>{filled}/{s.capacity}</span>
                            </div>
                            <div className="mini-progress">
                              <div style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card card-pad" style={{ marginTop: 18 }}>
                  <div className="section-title">All groups ({groups.length})</div>
                  <div className="section-desc">Manage your full roster.</div>
                  <div className="scrollx">
                    <table>
                      <thead>
                        <tr>
                          <th>Group</th>
                          <th>Members</th>
                          <th>Slot</th>
                          <th>Round 1</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(g => {
                          const { slot } = slotInfo(g.slotId);
                          return (
                            <tr key={g.id}>
                              <td><b>{g.name}</b></td>
                              <td>{g.members.map(m => m.name.split(" ")[0]).join(", ")}</td>
                              <td>{slot ? slot.label.split("·")[1] : "—"}</td>
                              <td><StatusBadge status={g.round1Status} /></td>
                              <td>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveGroup(g.id)}>Remove</button>
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
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveJudge(j.id)}>Remove</button>
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
                      {groups.reduce((a, g) => a + g.members.filter(m => m.r1Score !== null).length, 0)}
                      /{groups.reduce((a, g) => a + g.members.length, 0)}
                    </div>
                    <div className="delta">Round 1 individual test</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Avg. group score (R1)</div>
                    <div className="value">
                      {(() => {
                        const validScores = groups.map(g => groupRound1Avg(g)).filter((v): v is number => v !== null);
                        return validScores.length > 0
                          ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                          : "—";
                      })()}
                    </div>
                    <div className="delta">out of 5.0</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Reels submitted (R2)</div>
                    <div className="value">{groups.filter(g => g.round2.status !== "not-submitted").length}/{groups.length}</div>
                    <div className="delta">groups</div>
                  </div>
                  <div className="card stat-card">
                    <div className="label">Demo-day films (R3)</div>
                    <div className="value">{groups.filter(g => g.round3.status !== "not-submitted").length}/{groups.length}</div>
                    <div className="delta">groups</div>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <div className="section-title">Live leaderboard — who participated, who scored</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => addToast("Live dashboard exported as CSV (demo).", "success", "Exported ")}>⬇ Export CSV</button>
                  </div>
                  <div className="section-desc">Refreshes automatically as students complete the test and groups submit content.</div>
                  <div className="scrollx">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Group</th>
                          <th>R1 participation</th>
                          <th>R1 avg score</th>
                          <th>R2 status</th>
                          <th>R3 status</th>
                          <th>Cumulative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...groups]
                          .map(g => ({ g, r1: groupRound1Avg(g), completedMembers: g.members.filter(m => m.r1Score !== null).length, total: groupTotal(g) }))
                          .sort((a, b) => b.total - a.total)
                          .map((r, i) => (
                            <tr key={r.g.id}>
                              <td><b>#{i + 1}</b></td>
                              <td>
                                <b>{r.g.name}</b>
                                <div style={{ fontSize: 11, color: "var(--slate-2)" }}>{r.g.members.length} members</div>
                              </td>
                              <td>{r.completedMembers}/5 tested</td>
                              <td>{r.r1 !== null ? r.r1.toFixed(1) : "—"}</td>
                              <td><StatusBadge status={r.g.round2.status} /></td>
                              <td><StatusBadge status={r.g.round3.status} /></td>
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
    </div>
  );
}
