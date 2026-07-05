"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateContext, StatusBadge, initials, QUIZ } from "@/context/StateContext";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { students, setStudents, currentStudent, setCurrentStudent, rounds, addToast, slotInfo } = useStateContext();
  
  const [studentTab, setStudentTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const [studentLinks, setStudentLinks] = useState<Record<string, string>>({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2400); // 40 mins = 2400 secs
  const [examFinished, setExamFinished] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Adaptive testing state variables
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [testScore, setTestScore] = useState<number>(0);
  const [consecEasyCorrect, setConsecEasyCorrect] = useState<number>(0);
  const [consecHardWrong, setConsecHardWrong] = useState<number>(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<string>("Easy");
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!quizStarted || examFinished) return;
    if (timeLeft <= 0) {
      handleSubmitTest(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [quizStarted, timeLeft, examFinished]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, quizStarted]);

  useEffect(() => {
    if (!quizStarted || examFinished || isDisqualified) return;

    const disqualify = () => {
      if (isDisqualified) return;
      setIsDisqualified(true);
      addToast("You have been disqualified for violating proctoring rules.", "error", "Disqualified — ");
      handleSubmitTest(false, 0);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) disqualify();
    };
    const handleBlur = () => { disqualify(); };
    const handlePreventDefault = (e: Event) => { e.preventDefault(); };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) disqualify();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handlePreventDefault);
    document.addEventListener("cut", handlePreventDefault);
    document.addEventListener("paste", handlePreventDefault);
    document.addEventListener("contextmenu", handlePreventDefault);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handlePreventDefault);
      document.removeEventListener("cut", handlePreventDefault);
      document.removeEventListener("paste", handlePreventDefault);
      document.removeEventListener("contextmenu", handlePreventDefault);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, examFinished, isDisqualified]);

  useEffect(() => {
    if (!currentStudent) {
      router.replace("/student/login");
    }
  }, [currentStudent, router]);

  if (!currentStudent) return null;

  const activeStudent = students.find(s => s.id === currentStudent.studentId);

  if (!activeStudent) return null;

  const selectRandomQuestion = (diff: string, excluded: Set<string>) => {
    const pool = dbQuestions.filter(q => 
      q.Difficulty?.toLowerCase() === diff.toLowerCase() && !excluded.has(q.Question)
    );
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  async function handleStartTest() {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch("http://localhost:3001/api/questions");
      const json = await res.json();
      if (!json.success) throw new Error("Failed to load questions");
      if (!json.data || json.data.length === 0) {
        addToast("No questions found in the database. Contact your admin.", "error");
        setIsLoadingQuestions(false);
        return;
      }

      const allQs = json.data;
      setDbQuestions(allQs);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
      } catch (err) {
        addToast("Camera and Microphone access are required to take the test.", "error", "Proctoring required — ");
        setIsLoadingQuestions(false);
        return;
      }

      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error("Fullscreen request failed", err);
      }

      // Initialize adaptive testing starting with Easy
      const easyPool = allQs.filter((q: any) => q.Difficulty?.toLowerCase() === "easy");
      let startQ = null;
      let startDiff = "Easy";
      if (easyPool.length > 0) {
        startQ = easyPool[Math.floor(Math.random() * easyPool.length)];
      } else {
        startQ = allQs[Math.floor(Math.random() * allQs.length)];
        startDiff = startQ.Difficulty || "Easy";
      }

      setCurrentQuestion(startQ);
      setAnsweredIds(new Set([startQ.Question]));
      setCurrentQuestionNum(1);
      setSelectedOption(null);
      setTestScore(0);
      setConsecEasyCorrect(0);
      setConsecHardWrong(0);
      setCurrentDifficulty(startDiff);

      setQuizStarted(true);
      setTimeLeft(2400); // 40 minutes
      setExamFinished(false);
    } catch (err) {
      addToast("Error preparing the test: " + err, "error");
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  const handleSelectQuizOpt = (questionIdx: number, optionIdx: number) => {
    setQuizAnswers({ ...quizAnswers, [questionIdx]: optionIdx });
  };

  function handleSubmitTest(isTimeout = false, finalScore?: number) {
    if (!currentStudent) return;
    const scoreToSave = finalScore !== undefined ? finalScore : testScore;

    // Send score to backend to insert into Supabase scores table
    fetch(`http://localhost:3001/api/students/${currentStudent.studentId}/submit-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: scoreToSave,
        round: "round1",
        total_questions: 30
      })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        addToast("Score saved locally, but database sync failed.", "error");
      }
    })
    .catch(err => {
      console.error("Failed to sync score to database:", err);
      addToast("Failed to sync score to database.", "error");
    });

    setStudents(students.map(s => {
      if (s.id === currentStudent.studentId) {
        return {
          ...s,
          r1Score: scoreToSave,
          round1Status: "submitted",
        };
      }
      return s;
    }));

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setQuizStarted(false);
    setExamFinished(true);
    if (isTimeout) {
      addToast("Time is up! Your test has been automatically submitted.", "error", "Exam ended — ");
    } else {
      addToast("Test submitted successfully!", "success", "Exam completed — ");
    }
  }

  const handleNextQuestion = () => {
    if (selectedOption === null) {
      addToast("Please select an option before proceeding.", "error", "Selection required — ");
      return;
    }

    // 1. Grade current question
    const answeredText = selectedOption === 0 ? "Option A" :
                         selectedOption === 1 ? "Option B" :
                         selectedOption === 2 ? "Option C" :
                         selectedOption === 3 ? "Option D" : "";
    
    const cleanCorrect = currentQuestion["Correct Option"]?.trim();
    const isCorrect = 
      (cleanCorrect === answeredText) || 
      (cleanCorrect === "Option A" && selectedOption === 0) ||
      (cleanCorrect === "Option B" && selectedOption === 1) ||
      (cleanCorrect === "Option C" && selectedOption === 2) ||
      (cleanCorrect === "Option D" && selectedOption === 3) ||
      (cleanCorrect === "A" && selectedOption === 0) ||
      (cleanCorrect === "B" && selectedOption === 1) ||
      (cleanCorrect === "C" && selectedOption === 2) ||
      (cleanCorrect === "D" && selectedOption === 3) ||
      (cleanCorrect?.toLowerCase() === answeredText.toLowerCase());

    const newScore = isCorrect ? testScore + 1 : testScore;
    setTestScore(newScore);

    // 2. Adjust counters & decide next difficulty
    let nextDiff = currentDifficulty;
    let newConsecEasy = consecEasyCorrect;
    let newConsecHard = consecHardWrong;

    const currentDiffLower = currentQuestion.Difficulty?.toLowerCase();
    if (currentDiffLower === "easy") {
      if (isCorrect) {
        const updated = consecEasyCorrect + 1;
        if (updated === 2) {
          nextDiff = "Hard";
          newConsecEasy = 0;
        } else {
          newConsecEasy = updated;
        }
      } else {
        newConsecEasy = 0;
      }
      newConsecHard = 0;
    } else if (currentDiffLower === "hard") {
      if (!isCorrect) {
        const updated = consecHardWrong + 1;
        if (updated === 2) {
          nextDiff = "Easy";
          newConsecHard = 0;
        } else {
          newConsecHard = updated;
        }
      } else {
        newConsecHard = 0;
      }
      newConsecEasy = 0;
    }

    setConsecEasyCorrect(newConsecEasy);
    setConsecHardWrong(newConsecHard);
    setCurrentDifficulty(nextDiff);

    // If this was the 30th question, submit test
    if (currentQuestionNum >= 30) {
      handleSubmitTest(false, newScore);
      return;
    }

    // 3. Find next question matching difficulty
    const nextQuestion = selectRandomQuestion(nextDiff, answeredIds);
    if (!nextQuestion) {
      const fallbackDiff = nextDiff === "Easy" ? "Hard" : "Easy";
      const fallbackQuestion = selectRandomQuestion(fallbackDiff, answeredIds);
      if (!fallbackQuestion) {
        addToast("No more questions available in the bank.", "error");
        handleSubmitTest(false, newScore);
        return;
      }
      setCurrentQuestion(fallbackQuestion);
      setAnsweredIds(prev => new Set([...prev, fallbackQuestion.Question]));
      setCurrentDifficulty(fallbackDiff);
    } else {
      setCurrentQuestion(nextQuestion);
      setAnsweredIds(prev => new Set([...prev, nextQuestion.Question]));
    }

    setCurrentQuestionNum(prev => prev + 1);
    setSelectedOption(null);
  };

  const handleStudentRoundSubmit = (roundKey: "round2" | "round3") => {
    const link = studentLinks[roundKey] || "";
    const note = studentNotes[roundKey] || "";

    if (!link.trim()) {
      addToast("Add a video link or upload a file first.", "error", "Missing submission — ");
      return;
    }
    
    if (!currentStudent) return;

    fetch(`http://localhost:3001/api/students/${currentStudent.studentId}/submit-round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundKey, link, note })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        addToast("Failed to sync submission to server.", "error");
      }
    })
    .catch(err => {
      console.error("Error submitting round:", err);
      addToast("Failed to sync submission to server.", "error");
    });

    setStudents(students.map(s => {
      if (s.id === currentStudent.studentId) {
        return {
          ...s,
          [roundKey]: { status: "pending", link, note, juryScore: null },
        };
      }
      return s;
    }));

    addToast("Submission sent for jury review.", "success", "Submitted — ");
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
          <div className="side-portal-tag">Student</div>
          <div className="side-nav">
            <div className={`side-link ${studentTab === "home" ? "active" : ""}`} onClick={() => setStudentTab("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span className="lbl">My Slot</span>
            </div>
            <div className={`side-link ${studentTab === "round1" ? "active" : ""}`} onClick={() => setStudentTab("round1")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span className="lbl">Round 1 · Test</span>
            </div>
            <div className={`side-link ${studentTab === "round2" ? "active" : ""}`} onClick={() => setStudentTab("round2")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path></svg>
              <span className="lbl">Round 2 · Reel</span>
            </div>
            <div className={`side-link ${studentTab === "round3" ? "active" : ""}`} onClick={() => setStudentTab("round3")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              <span className="lbl">Round 3 · Demo Day</span>
            </div>
          </div>
          <div className="side-foot">
            <div className="side-user">
              <div className="avatar">{initials(activeStudent.name)}</div>
              <div>
                <div className="u-name">{activeStudent.name}</div>
                <div className="u-role">{activeStudent.college}</div>
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
                  <div className="section-title">Welcome, {activeStudent.name.split(" ")[0]}</div>
                  <div className="section-desc">{activeStudent.college}</div>
                  <div style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 10, background: "#FCFBFA", marginTop: 6 }}>
                    <div style={{ fontSize: 11.5, color: "var(--slate-2)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Your assigned slot</div>
                    <div style={{ fontSize: 18, fontFamily: "Cambria, serif", marginTop: 6 }}>{slotInfo(activeStudent.slotId).slot?.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--slate-2)", marginTop: 4 }}>Up to 40 students test together in this slot</div>
                  </div>
                  <div className="stack" style={{ marginTop: 16 }}>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 1 · Individual Test</span>
                      <StatusBadge status={rounds.round1 === "not-started" ? "not-started" : activeStudent.r1Score !== null ? "submitted" : "in-progress"} />
                    </div>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 2 · Reel Upload</span>
                      <StatusBadge status={activeStudent.round2.status} />
                    </div>
                    <div className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Round 3 · Demo Day Film</span>
                      <StatusBadge status={activeStudent.round3.status} />
                    </div>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="section-title">Your Profile Details</div>
                  <div className="section-desc">Your registered contact information.</div>
                  <div className="stack">
                    <div className="row-between" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Email</span>
                      <span style={{ fontSize: 13 }}>{activeStudent.email}</span>
                    </div>
                    <div className="row-between" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Phone</span>
                      <span style={{ fontSize: 13 }}>{activeStudent.phone}</span>
                    </div>
                    <div className="row-between" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>College</span>
                      <span style={{ fontSize: 13 }}>{activeStudent.college}</span>
                    </div>
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

                {rounds.round1 !== "not-started" && (activeStudent.r1Score !== null || examFinished) && !isDisqualified && (
                  <div className="empty">
                    <div className="ico">✅</div>
                    <div className="t">Thank you! Your exam has ended.</div>
                    <p style={{ fontSize: 12.5 }}>Your test has been successfully submitted. You may now close this window.</p>
                  </div>
                )}

                {rounds.round1 !== "not-started" && isDisqualified && (
                  <div className="empty" style={{ borderColor: 'var(--red)', background: 'var(--red-bg)' }}>
                    <div className="ico">🚨</div>
                    <div className="t" style={{ color: 'var(--red)' }}>You have been disqualified</div>
                    <p style={{ fontSize: 12.5, color: 'var(--red)' }}>A violation of the proctoring rules was detected (e.g. switching tabs, minimizing, or exiting fullscreen). Your test has been submitted with a score of 0.</p>
                  </div>
                )}

                {rounds.round1 !== "not-started" && activeStudent.r1Score === null && !quizStarted && !examFinished && !isDisqualified && (
                  <div className="card card-pad" style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <div className="section-title" style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Exam Instructions & Rules</div>
                    <div className="section-desc" style={{ marginBottom: "20px" }}>Please read the following instructions carefully before starting the exam.</div>
                    
                    <div style={{ 
                      padding: "16px", 
                      border: "1px solid var(--line)", 
                      borderRadius: "10px", 
                      background: "#FCFBFA", 
                      marginBottom: "20px",
                      textAlign: "left"
                    }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "var(--slate-1)" }}>
                        🕒 Your slot: <b>{slotInfo(activeStudent.slotId).slot?.label}</b>
                      </div>
                      
                      <ul style={{ 
                        fontSize: "13px", 
                        lineHeight: "1.6", 
                        color: "var(--slate-1)", 
                        paddingLeft: "20px",
                        margin: 0
                      }}>
                        <li style={{ marginBottom: "8px" }}>📝 <b>Format:</b> There will be exactly <b>30 questions</b>.</li>
                        <li style={{ marginBottom: "8px" }}>⏱️ <b>Duration:</b> You have <b>40 minutes</b> to complete the test (strict auto-submission).</li>
                        <li style={{ marginBottom: "8px" }}>🚫 <b>No Backtracking:</b> After answering a question, you <b>cannot go back</b> to review or change it.</li>
                        <li style={{ marginBottom: "8px" }}>✅ <b>Marking:</b> There is <b>no negative marking</b>.</li>
                        <li style={{ marginBottom: "8px" }}>⚠️ <b>Proctoring:</b> Your Camera and Microphone must be turned <b>ON</b>. The system monitors your hardware status continuously.</li>
                        <li style={{ marginBottom: "8px" }}>🚨 <b>Disqualification:</b> You will be automatically disqualified if you attempt to cheat (e.g. switching tabs, minimizing browser, or having other people in the room).</li>
                      </ul>
                    </div>

                    <label style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "10px", 
                      fontSize: "13px", 
                      color: "var(--slate-1)",
                      cursor: "pointer",
                      marginBottom: "22px",
                      textAlign: "left"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isAcknowledged} 
                        onChange={(e) => setIsAcknowledged(e.target.checked)} 
                        style={{ marginTop: "3px" }}
                      />
                      <span>I acknowledge that I have read the rules and agree to keep my camera/microphone active during the exam. I understand that violating these rules will lead to immediate disqualification.</span>
                    </label>

                    <button 
                      className="btn btn-coral btn-block" 
                      onClick={handleStartTest} 
                      disabled={isLoadingQuestions || !isAcknowledged}
                    >
                      {isLoadingQuestions ? "Preparing exam & requesting media access..." : "Start test"}
                    </button>
                  </div>
                )}

                {rounds.round1 !== "not-started" && activeStudent.r1Score === null && quizStarted && !examFinished && !isDisqualified && (
                  <div className="card card-pad">
                    <style>{`
                      @keyframes pulse {
                        0% { opacity: 0.3; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                      }
                    `}</style>
                    <div className="row-between" style={{ marginBottom: 14 }}>
                      <div className="section-title" style={{ marginBottom: 0 }}>Round 1 Test</div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span className="badge badge-amber">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        <span className="badge badge-navy">Progress: {currentQuestionNum}/30 answered</span>
                      </div>
                    </div>

                    {/* Fake Camera Proctoring Widget (Webcam active but hidden) */}
                    <div style={{
                      position: "fixed",
                      top: "80px",
                      right: "20px",
                      padding: "10px 16px",
                      background: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                      border: "1px solid #ef4444",
                      zIndex: 1000,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{
                        width: "8px",
                        height: "8px",
                        background: "#ef4444",
                        borderRadius: "50%",
                        animation: "pulse 1s infinite"
                      }}></span>
                      <span style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                        PROCTORING ACTIVE
                      </span>
                      <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
                    </div>

                    {currentQuestion && (() => {
                      const opts = [
                        currentQuestion["Option A"], 
                        currentQuestion["Option B"], 
                        currentQuestion["Option C"], 
                        currentQuestion["Option D"]
                      ];
                      return (
                        <div className="quiz-q">
                          <div className="qtext">{currentQuestionNum}. {currentQuestion.Question}</div>
                          {opts.map((o, oi) => (
                            <label key={oi} className={`opt ${selectedOption === oi ? "selected" : ""}`} onClick={() => setSelectedOption(oi)}>
                              <input type="radio" name={`q_${currentQuestion.id}`} checked={selectedOption === oi} readOnly />
                              <span>{o}</span>
                            </label>
                          ))}
                        </div>
                      );
                    })()}
                    <button className="btn btn-coral btn-block" onClick={handleNextQuestion} style={{ marginTop: 10 }}>
                      {currentQuestionNum === 30 ? "Submit test" : "Next Question"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- ROUND 2 / 3 UPLOADS --- */}
            {(studentTab === "round2" || studentTab === "round3") && (
              <div className="card card-pad">
                {(() => {
                  const roundKey = studentTab as "round2" | "round3";
                  const r = activeStudent[roundKey];
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
                      <div className="section-desc">Upload your individual {formatLabel} for {roundLabel}. Make sure all requirements are met.</div>
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
