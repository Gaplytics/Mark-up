"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

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

export default function SuperadminLoginPage() {
  const router = useRouter();
  const { addToast } = useStateContext();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email === "superadmin@markup.com" && password === "Zxcvb@098") {
      if (typeof window !== "undefined") {
        localStorage.setItem("superadmin_authenticated", "true");
      }

      addToast("Successfully signed in as Superadmin", "success", "Welcome back!");
      router.push("/superadmin/dashboard");
    } else {
      addToast("Incorrect email or password.", "error", "Sign in failed");
    }
  };

  return (
    <div id="screen-superadmin-login">
      <div className="login-wrap">
        <div className="login-side">
          <div className="brand" style={{ marginBottom: 34 }}>
            <img src="/logo-icon.png" alt="Logo" style={{ width: "30px", height: "30px", marginRight: "8px", objectFit: "contain" }} />
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <h2>Superadmin Portal</h2>
          <p>Manage colleges, set up credentials, and oversee the entire campus operations from a single central console.</p>
          <div className="pill-row">
            <span className="pill">College Management</span>
            <span className="pill">Credential Controls</span>
            <span className="pill">Global Platform Settings</span>
          </div>
        </div>
        <div className="login-form-col">
          <div className="login-box">
            <Link href="/" className="back-link" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              ← Back to portal selection
            </Link>
            <h3 style={{ fontSize: 22, marginBottom: 6 }}>Superadmin sign in</h3>
            <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 24 }}>Enter credentials to access the central admin panel.</p>
            
            <div className="form-group">
              <label>Superadmin email</label>
              <input 
                className="input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="superadmin@markup.com" 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  className="input" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
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
            
            <button className="btn btn-primary btn-block" onClick={handleLogin} style={{ marginTop: 6 }}>
              Sign in to admin dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
