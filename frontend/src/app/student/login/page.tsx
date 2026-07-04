"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export default function StudentLoginPage() {
  const router = useRouter();
  const { students, setCurrentStudent, addToast } = useStateContext();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginStudentId, setLoginStudentId] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", ""]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStudentSendOtp = async () => {
    if (!loginEmail.trim()) {
      addToast("Please enter your email.", "error", "Missing info — ");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch("http://localhost:3001/api/student/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      setOtpStep(true);
      setOtpInputs(["", "", "", ""]);
      addToast("OTP sent to your email successfully.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to send OTP", "error", "Error — ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStudentVerifyOtp = async () => {
    const entered = otpInputs.join("");
    if (entered.length < 4) {
      addToast("Enter the full 4-digit OTP.", "error", "Incomplete — ");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch("http://localhost:3001/api/student/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), code: entered })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const dbStudent = data.student;
      setCurrentStudent({
        studentId: dbStudent.id,
        phone: dbStudent.phone,
        name: dbStudent.name,
      });

      addToast("Welcome, " + dbStudent.name.split(" ")[0] + "!", "success");
      router.push("/student/dashboard");
    } catch (err: any) {
      addToast(err.message || "Verification failed", "error", "Invalid OTP — ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="screen-student-login">
      <div className="login-wrap">
        <div className="login-side">
          <div className="brand" style={{ marginBottom: 34 }}>
            <div className="mark">M</div>
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <h2>Concept to campaign starts here.</h2>
          <p>Your college has already added you. Verify with the OTP sent to your registered email to see your slot and get started.</p>
          <div className="pill-row">
            <span className="pill">OTP secured</span>
            <span className="pill">Slot-based testing</span>
            <span className="pill">40 students / slot</span>
          </div>
        </div>
        <div className="login-form-col">
          <div className="login-box">
            <Link href="/" onClick={() => setOtpStep(false)} className="back-link" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              ← Back to portal selection
            </Link>

            {!otpStep ? (
              <div id="student-step-phone">
                <h3 style={{ fontSize: 22, marginBottom: 6 }}>Student sign in</h3>
                <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 22 }}>Use the email address your college registered for you.</p>
                <div className="form-group">
                  <label>Registered email address</label>
                  <input 
                    className="input" 
                    placeholder="student@example.com"
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    disabled={isProcessing}
                  />
                  <p className="hint">Only emails uploaded by your College Admin can sign in.</p>
                </div>
                <button className="btn btn-coral btn-block" onClick={handleStudentSendOtp} disabled={isProcessing}>
                  {isProcessing ? "Sending..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div id="student-step-otp">
                <h3 style={{ fontSize: 22, marginBottom: 6 }}>Enter the OTP</h3>
                <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 18 }}>Sent to <b>{loginEmail.trim()}</b></p>
                <div className="otp-box">
                  {otpInputs.map((val, idx) => (
                    <input
                      key={idx}
                      maxLength={1}
                      className="otpd"
                      value={val}
                      onChange={(e) => {
                        const newInputs = [...otpInputs];
                        newInputs[idx] = e.target.value;
                        setOtpInputs(newInputs);
                      }}
                      disabled={isProcessing}
                    />
                  ))}
                </div>
                <button className="btn btn-primary btn-block" onClick={handleStudentVerifyOtp} style={{ marginTop: 16 }} disabled={isProcessing}>
                  {isProcessing ? "Verifying..." : "Verify & continue"}
                </button>
                <button className="btn btn-ghost btn-block" onClick={handleStudentSendOtp} style={{ marginTop: 8 }} disabled={isProcessing}>
                  Resend OTP
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
