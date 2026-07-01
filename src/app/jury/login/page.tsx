"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export default function JuryLoginPage() {
  const router = useRouter();
  const { judges, setCurrentJury, addToast } = useStateContext();
  
  const [loginJuryId, setLoginJuryId] = useState("J1");

  const handleJuryLogin = () => {
    const selectedJudge = judges.find(j => j.id === loginJuryId) || judges[0];
    setCurrentJury(selectedJudge);
    addToast("Welcome — ", "success", "Signed in as " + selectedJudge.name);
    router.push("/jury/dashboard");
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
            <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 24 }}>For faculty appointed as MarkUp jurors.</p>
            <div className="form-group">
              <label>Juror email</label>
              <select className="input" value={loginJuryId} onChange={(e) => setLoginJuryId(e.target.value)}>
                {judges.map(j => (
                  <option key={j.id} value={j.id}>{j.name} — {j.email}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Access code</label>
              <input className="input" defaultValue="JURY-2026" />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleJuryLogin}>
              Sign in to scoring panel
            </button>
            <p style={{ fontSize: 11.5, color: "var(--slate-2)", marginTop: 14, textAlign: "center" }}>
              Demo mode — any access code will sign you in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
