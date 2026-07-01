"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export default function CollegeLoginPage() {
  const router = useRouter();
  const { addToast, setCollegeAdminName } = useStateContext();
  
  const [loginCollegeEmail, setLoginCollegeEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleCollegeLogin = () => {
    if (loginCollegeEmail === "admin@alliance.com" && loginPassword === "Zxcvb@098") {
      setCollegeAdminName("Alliance University");
      addToast("Welcome back — ", "success", "Signed in as Alliance University");
      router.push("/college/dashboard");
    } else {
      addToast("id and password is wrong.", "error", "Sign in failed — ");
    }
  };

  return (
    <div id="screen-college-login">
      <div className="login-wrap">
        <div className="login-side">
          <div className="brand" style={{ marginBottom: 34 }}>
            <div className="mark">M</div>
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <h2>Run MarkUp for your campus, end to end.</h2>
          <p>Upload your participating groups, appoint your School of Business jury, flag off each round, and watch scores update live as teams compete.</p>
          <div className="pill-row">
            <span className="pill">Group management</span>
            <span className="pill">Round control</span>
            <span className="pill">Live scoring dashboard</span>
          </div>
        </div>
        <div className="login-form-col">
          <div className="login-box">
            <Link href="/" className="back-link" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              ← Back to portal selection
            </Link>
            <h3 style={{ fontSize: 22, marginBottom: 6 }}>College Admin sign in</h3>
            <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 24 }}>For the official MarkUp coordinator at your college.</p>
            <div className="form-group">
              <label>Admin email</label>
              <input className="input" value={loginCollegeEmail} onChange={(e) => setLoginCollegeEmail(e.target.value)} placeholder="admin@alliance.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleCollegeLogin} style={{ marginTop: 6 }}>
              Sign in to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
