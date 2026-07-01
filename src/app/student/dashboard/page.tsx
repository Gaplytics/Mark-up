"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, StatusBadge, initials, QUIZ } from "@/context/StateContext";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { groups, setGroups, currentStudent, setCurrentStudent, rounds, addToast, slotInfo } = useStateContext();
  
  const [studentTab, setStudentTab] = useState("home");
  
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const [studentLinks, setStudentLinks] = useState<Record<string, string>>({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentStudent) {
      router.replace("/student/login");
    }
  }, [currentStudent, router]);

  if (!currentStudent) return null;

  const activeGroup = groups.find(g => g.id === currentStudent.groupId);
  const activeMember = activeGroup ? activeGroup.members[currentStudent.memberIdx] : null;

  if (!activeGroup || !activeMember) return null;

  const handleStartTest = () => {
    setQuizStarted(true);
    setQuizAnswers({});
  };

  const handleSelectQuizOpt = (questionIdx: number, optionIdx: number) => {
    setQuizAnswers({ ...quizAnswers, [questionIdx]: optionIdx });
  };

  const handleSubmitTest = () => {
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < QUIZ.length) {
      addToast("Answer all " + QUIZ.length + " questions before submitting.", "error", "Incomplete — ");
      return;
    }
    let score = 0;
    QUIZ.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) score++;
    });

    setGroups(groups.map(g => {
      if (g.id === currentStudent.groupId) {
        const updatedMembers = [...g.members];
        updatedMembers[currentStudent.memberIdx] = {
          ...updatedMembers[currentStudent.memberIdx],
          r1Score: score,
        };
        return {
          ...g,
          members: updatedMembers,
          round1Status: "submitted",
        };
      }
      return g;
    }));

    setQuizStarted(false);
    addToast("Test submitted! You scored " + score + "/5.", "success", "Nice work — ");
    setStudentTab("round1");
  };

  const handleStudentRoundSubmit = (roundKey: "round2" | "round3") => {
    const link = studentLinks[roundKey] || "";
    const note = studentNotes[roundKey] || "";

    if (!link.trim()) {
      addToast("Add a video link or upload a file first.", "error", "Missing submission — ");
      return;
    }

    setGroups(groups.map(g => {
      if (g.id === currentStudent.groupId) {
        return {
          ...g,
          [roundKey]: { status: "pending", link, note, juryScore: null },
        };
      }
      return g;
    }));

    addToast(activeGroup.name + "'s submission sent for jury review.", "success", "Submitted — ");
    setStudentTab(roundKey);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    router.push("/");
  };

  return (
    <div id="screen-student-app">
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
          <div className="side-portal-tag">Student</div>
          <div className="side-nav">
            <div className={`side-link ${studentTab === "home" ? "active" : ""}`} onClick={() => setStudentTab("home")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">My Slot</span>
            </div>
            <div className={`side-link ${studentTab === "round1" ? "active" : ""}`} onClick={() => setStudentTab("round1")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 1 · Test</span>
            </div>
            <div className={`side-link ${studentTab === "round2" ? "active" : ""}`} onClick={() => setStudentTab("round2")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 2 · Reel</span>
            </div>
            <div className={`side-link ${studentTab === "round3" ? "active" : ""}`} onClick={() => setStudentTab("round3")} style={{ cursor: "pointer" }}>
              <span className="dot"></span><span className="lbl">Round 3 · Demo Day</span>
            </div>
          </div>
          <div className="side-foot">
            <div className="side-user">
              <div className="avatar">{initials(activeMember.name)}</div>
              <div>
                <div className="u-name">{activeMember.name}</div>
                <div className="u-role">{activeGroup.name}</div>
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
                {studentTab === "home" && "My Slot"}
                {studentTab === "round1" && "Round 1 · Test"}
                {studentTab === "round2" && "Round 2 · Reel"}
                {studentTab === "round3" && "Round 3 · Demo Day"}
              </h2>
              <div className="sub">
                {studentTab === "home" && "Your test slot and round status"}
                {studentTab === "round1" && "Available only during your assigned slot, after Round 1 is flagged off"}
                {studentTab === "round2" && "Upload your group's 90-second Reel or Short"}
                {studentTab === "round3" && "Upload your group's 60-second co-created film"}
              </div>
            </div>
          </div>

          <div className="content">
            {/* --- MY SLOT --- */}
            {studentTab === "home" && (
              <div className="grid grid-2">
                <div className="card card-pad">
                  <div className="section-title">Welcome, {activeMember.name.split(" ")[0]}</div>
                  <div className="section-desc">{activeGroup.name} · {activeGroup.college}</div>
                  <div style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA", marginTop: 6 }}>
                    <div style={{ fontSize: 11.5, color: "var(--slate-2)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Your assigned slot</div>
                    <div style={{ fontSize: 18, fontFamily: "Cambria, serif", marginTop: 6 }}>{slotInfo(activeGroup.slotId).slot?.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--slate-2)", marginTop: 4 }}>Up to 40 students test together in this slot</div>
                  </div>
                  <div className="stack" style={{ marginTop: 16 }}>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 1 · Individual Test</span>
                      <StatusBadge status={rounds.round1 === "not-started" ? "not-started" : activeMember.r1Score !== null ? "submitted" : "in-progress"} />
                    </div>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 2 · Reel Upload</span>
                      <StatusBadge status={activeGroup.round2.status} />
                    </div>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 3 · Demo Day Film</span>
                      <StatusBadge status={activeGroup.round3.status} />
                    </div>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="section-title">Your group — {activeGroup.name}</div>
                  <div className="section-desc">All 5 members must complete Round 1 individually.</div>
                  <div className="stack">
                    {activeGroup.members.map((mm, i) => (
                      <div key={i} className="row-between" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 9 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: i === currentStudent.memberIdx ? "var(--coral)" : "var(--navy-2)" }}>{initials(mm.name)}</div>
                          <span style={{ fontSize: 13 }}>{mm.name}{i === currentStudent.memberIdx ? " (you)" : ""}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--slate-2)" }}>{mm.r1Score !== null ? mm.r1Score + "/5" : "Not tested"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- ROUND 1 TEST --- */}
            {studentTab === "round1" && (
              <div className="card card-pad">
                {rounds.round1 === "not-started" && (
                  <div className="empty">
                    <div className="ico">🚦</div>
                    <div className="t">Round 1 hasn't been flagged off yet</div>
                    <p style={{ fontSize: 12.5, maxWidth: 380, margin: "0 auto" }}>Your College Admin will flag off Round 1 once your slot is ready to begin. Check back at your slot time.</p>
                  </div>
                )}

                {rounds.round1 !== "not-started" && activeMember.r1Score !== null && (
                  <div className="empty">
                    <div className="ico">✅</div>
                    <div className="t">You've completed the Round 1 test</div>
                    <p style={{ fontSize: 12.5 }}>Your score: <b>{activeMember.r1Score} / 5</b>. Your group's average will be calculated once all 5 members finish.</p>
                  </div>
                )}

                {rounds.round1 !== "not-started" && activeMember.r1Score === null && !quizStarted && (
                  <div className="card card-pad">
                    <div className="section-title">Ready to begin?</div>
                    <div className="section-desc">This is a timed, individual test. You can only attempt it once, within your assigned slot.</div>
                    <div style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA", marginBottom: 18 }}>
                      <div style={{ fontSize: 13 }}>🕒 Your slot: <b>{slotInfo(activeGroup.slotId).slot?.label}</b></div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>📝 5 multiple-choice questions · 1 mark each</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>⏱ Suggested time: 8 minutes</div>
                    </div>
                    <button className="btn btn-coral btn-block" onClick={handleStartTest}>Start test</button>
                  </div>
                )}

                {rounds.round1 !== "not-started" && activeMember.r1Score === null && quizStarted && (
                  <div className="card card-pad">
                    <div className="row-between" style={{ marginBottom: 14 }}>
                      <div className="section-title" style={{ marginBottom: 0 }}>Round 1 Test</div>
                      <span className="badge badge-amber">Question progress: <span id="qProgress">{Object.keys(quizAnswers).length}</span>/5 answered</span>
                    </div>
                    {QUIZ.map((q, qi) => (
                      <div key={qi} className="quiz-q">
                        <div className="qtext">{qi + 1}. {q.q}</div>
                        {q.opts.map((o, oi) => (
                          <label key={oi} className={`opt ${quizAnswers[qi] === oi ? "selected" : ""}`} onClick={() => handleSelectQuizOpt(qi, oi)}>
                            <input type="radio" name={`q${qi}`} checked={quizAnswers[qi] === oi} readOnly />
                            <span>{o}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                    <button className="btn btn-coral btn-block" onClick={handleSubmitTest} style={{ marginTop: 10 }}>Submit test</button>
                  </div>
                )}
              </div>
            )}

            {/* --- ROUND 2 / 3 UPLOADS --- */}
            {(studentTab === "round2" || studentTab === "round3") && (
              <div className="card card-pad">
                {(() => {
                  const roundKey = studentTab as "round2" | "round3";
                  const r = activeGroup[roundKey];
                  const formatLabel = roundKey === "round2" ? "90-second Reel / Short" : "60-second Demo Day film";
                  const roundLabel = roundKey === "round2" ? "Round 2" : "Round 3";
                  const otherRoundLive = rounds[roundKey] !== "live";

                  if (otherRoundLive) {
                    return (
                      <div className="empty">
                        <div className="ico">🔒</div>
                        <div className="t">{roundLabel} isn't open yet</div>
                        <p style={{ fontSize: 12.5 }}>Your College Admin will flag off {roundLabel} when it's time. Come back then to upload your {formatLabel}.</p>
                      </div>
                    );
                  }

                  if (r.status === "approved") {
                    return (
                      <div className="empty">
                        <div className="ico">🎉</div>
                        <div className="t">Your {formatLabel} was approved!</div>
                        <p style={{ fontSize: 12.5 }}>Score from jury: <b>{r.juryScore !== null ? r.juryScore + "/10" : "Pending"}</b></p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="section-title">Upload your {formatLabel}</div>
                      <div className="section-desc">One submission per group for {roundLabel}. {activeGroup.name} — make sure all 5 members are credited.</div>
                      {r.status === "pending" && (
                        <div style={{ marginBottom: 16 }}>
                          <StatusBadge status="pending" />
                          <span style={{ fontSize: 12, color: "var(--slate-2)", marginLeft: 6 }}>Submitted — awaiting jury review</span>
                        </div>
                      )}
                      {r.status === "rejected" && (
                        <div style={{ marginBottom: 16, padding: 12, background: "var(--red-bg)", borderRadius: 9, fontSize: 12.5, color: "var(--red)" }}>
                          Jury requested changes{r.note ? ": " + r.note : ""}. Please re-upload below.
                        </div>
                      )}
                      <div className="upload-drop" style={{ marginBottom: 18 }}>
                        <div className="ico">🎬</div>
                        <div className="t">Drag & drop your video file</div>
                        <div className="d">MP4 — under 200MB — or paste a link below</div>
                      </div>
                      <div className="form-group">
                        <label>Reel / video link</label>
                        <input
                          className="input"
                          placeholder="https://drive.google.com/..."
                          value={studentLinks[roundKey] || r.link || ""}
                          onChange={(e) => setStudentLinks({ ...studentLinks, [roundKey]: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Note to jury (optional)</label>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Anything the jury should know"
                          value={studentNotes[roundKey] || r.note || ""}
                          onChange={(e) => setStudentNotes({ ...studentNotes, [roundKey]: e.target.value })}
                        />
                      </div>
                      <button className="btn btn-coral btn-block" onClick={() => handleStudentRoundSubmit(roundKey)}>Submit for review</button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
