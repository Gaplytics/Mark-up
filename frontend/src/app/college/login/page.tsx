"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";
// Import removed

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function CollegeLoginPage() {
  const router = useRouter();
  const { addToast, setCollegeAdminName, setCollegeAdminId } = useStateContext();
  
  const [loginCollegeEmail, setLoginCollegeEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleCollegeLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/colleges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginCollegeEmail.toLowerCase(), password: loginPassword }),
      });
      const json = await res.json();
      
      if (json.success && json.college) {
        setCollegeAdminName(json.college.name);
        setCollegeAdminId(json.college.id);
        addToast("Welcome back — ", "success", `Signed in as ${json.college.name}`);
        router.push("/college/dashboard");
        return;
      }
    } catch (err) {
      console.error("Backend login error:", err);
    }

    addToast("id and password is wrong.", "error", "Sign in failed — ");
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
              <div style={{ position: "relative" }}>
                <input 
                  className="input" 
                  type={showPassword ? "text" : "password"} 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="••••••••" 
                  style={{ paddingRight: "40px" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--slate-2)",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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
