"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export default function JuryLoginPage() {
  const router = useRouter();
  const { judges, setCurrentJury, addToast } = useStateContext();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleJuryLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      addToast("Please enter both email and password.", "error", "Missing info");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("http://localhost:3001/api/jury/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // Map DB judge to local state format
      const dbJudge = data.judge;
      let selectedJudge = judges.find(j => j.id === dbJudge.id);
      
      if (!selectedJudge) {
        selectedJudge = {
          id: dbJudge.id,
          name: dbJudge.name,
          email: dbJudge.email,
          dept: dbJudge.dept || "Jury Panel",
          collegeId: dbJudge.college_id,
        };
      } else {
        selectedJudge.collegeId = dbJudge.college_id;
      }

      setCurrentJury(selectedJudge);
      addToast("Welcome — ", "success", "Signed in as " + selectedJudge.name);
      router.push("/jury/dashboard");
    } catch (err: any) {
      addToast(err.message || "Invalid credentials", "error", "Login failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="screen-jury-login">
      <div className="login-wrap">
        <div className="login-side">
          <div className="brand" style={{ marginBottom: 34 }}>
            <div className="mark">M</div>
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <h2>Score with confidence, in one place.</h2>
          <p>See exactly which groups are assigned to you, watch submissions arrive in real time, and approve or score content without leaving the page.</p>
          <div className="pill-row">
            <span className="pill">Round 2 reel review</span>
            <span className="pill">Round 3 demo-day review</span>
          </div>
        </div>
        <div className="login-form-col">
          <div className="login-box">
            <Link href="/" className="back-link" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              ← Back to portal selection
            </Link>
            <h3 style={{ fontSize: 22, marginBottom: 6 }}>Jury sign in</h3>
            <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 24 }}>For faculty appointed as MarkUp jurys.</p>
            <div className="form-group">
              <label>Juror email</label>
              <input 
                className="input" 
                placeholder="juror@example.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ position: "relative" }}>
              <label>Password</label>
              <input 
                className="input" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={isProcessing}
              />
              <span 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: "absolute", 
                  right: 14, 
                  top: 36, 
                  cursor: "pointer", 
                  color: "var(--slate-2)"
                }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </span>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleJuryLogin} disabled={isProcessing}>
              {isProcessing ? "Authenticating..." : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
