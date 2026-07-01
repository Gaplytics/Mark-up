"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export default function StudentLoginPage() {
  const router = useRouter();
  const { groups, setCurrentStudent, addToast } = useStateContext();
  
  const [loginStudentVal, setLoginStudentVal] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", ""]);

  // Sync first student phone select
  useEffect(() => {
    if (groups.length > 0 && groups[0].members.length > 0 && !loginStudentVal) {
      setLoginStudentVal(`${groups[0].id}|0|${groups[0].members[0].phone}`);
    }
  }, [groups, loginStudentVal]);

  const getStudentPhoneList = () => {
    const list: { val: string; label: string }[] = [];
    groups.forEach(g => {
      g.members.forEach((m, idx) => {
        list.push({
          val: `${g.id}|${idx}|${m.phone}`,
          label: `${m.phone} — ${m.name} (${g.name})`,
        });
      });
    });
    return list;
  };

  const handleStudentSendOtp = () => {
    const [gid, idx, phone] = loginStudentVal.split("|");
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setOtpCode(code);
    setOtpStep(true);
    setOtpInputs([code[0], code[1], code[2], code[3]]); // auto fill for demo
    addToast("OTP sent to " + phone + ".", "success");
  };

  const handleStudentVerifyOtp = () => {
    const entered = otpInputs.join("");
    if (entered.length < 4) {
      addToast("Enter the full 4-digit OTP.", "error", "Incomplete — ");
      return;
    }
    if (entered !== otpCode) {
      addToast("That OTP doesn't match. Try again.", "error", "Invalid OTP — ");
      return;
    }
    const [gid, idx] = loginStudentVal.split("|");
    const g = groups.find(x => x.id === gid);
    if (!g) return;
    const member = g.members[parseInt(idx)];
    setCurrentStudent({
      groupId: g.id,
      memberIdx: parseInt(idx),
      phone: member.phone,
      name: member.name,
    });
    addToast("Welcome, " + member.name.split(" ")[0] + "!", "success");
    router.push("/student/dashboard");
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
          <p>Your college has already added your group. Verify with the OTP sent to your registered number to see your slot and get started.</p>
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
                <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 22 }}>Use the mobile number your college registered with your group.</p>
                <div className="form-group">
                  <label>Registered mobile number</label>
                  <select className="input" value={loginStudentVal} onChange={(e) => setLoginStudentVal(e.target.value)}>
                    {getStudentPhoneList().map(s => (
                      <option key={s.val} value={s.val}>{s.label}</option>
                    ))}
                  </select>
                  <p className="hint">Only numbers uploaded by your College Admin can sign in.</p>
                </div>
                <button className="btn btn-coral btn-block" onClick={handleStudentSendOtp}>Send OTP</button>
              </div>
            ) : (
              <div id="student-step-otp">
                <h3 style={{ fontSize: 22, marginBottom: 6 }}>Enter the OTP</h3>
                <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 18 }}>Sent to <b>{loginStudentVal.split("|")[2]}</b></p>
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
                    />
                  ))}
                </div>
                <div className="demo-banner">🔐 Demo mode: your OTP is <b>{otpCode}</b> — auto-filled for you.</div>
                <button className="btn btn-primary btn-block" onClick={handleStudentVerifyOtp} style={{ marginTop: 16 }}>Verify & continue</button>
                <button className="btn btn-ghost btn-block" onClick={handleStudentSendOtp} style={{ marginTop: 8 }}>Resend OTP</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
