"use client";

import React from "react";
import Link from "next/link";
import { useStateContext } from "@/context/StateContext";

export default function LandingPage() {
  const { toasts } = useStateContext();

  return (
    <>

      <div id="screen-landing">
        <div className="landing">
          <div className="container">
            <div className="landing-top">
              <div className="brand">
                <img src="/logo-icon.png" alt="Logo" style={{ width: "30px", height: "30px", marginRight: "8px", objectFit: "contain" }} />
                <div>
                  <div className="name">MarkUp</div>
                  <div className="sub">Concept to Campaign</div>
                </div>
              </div>
              <div className="pill-row" style={{ marginTop: 0, alignItems: "center" }}>
                <img src="/allianceuniversity.png" alt="Alliance University" style={{ height: 38, objectFit: "contain" }} />
                <img src="/gaplytiq.png" alt="Powered by Gaplytiq" style={{ height: 80, objectFit: "contain" }} />
              </div>
            </div>

            <div className="landing-hero" style={{ padding: "80px 0 40px" }}>
              <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.08)", padding: "6px 14px", borderRadius: "100px", border: "1px solid rgba(255, 255, 255, 0.15)", marginBottom: "20px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold)" }}></span>
                <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--gold)" }}>Organised by Gaplytiq</span>
              </div>
              <h1 style={{ fontSize: "52px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1", marginBottom: "20px" }}>
                One platform to run MarkUp — from registration to results.
              </h1>
              <p style={{ fontSize: "17px", color: "#C7CDE8", maxWidth: "650px", lineHeight: "1.6", marginBottom: "30px" }}>
                Welcome to the official portal for the <strong>MarkUp Contest</strong>, proudly organised by <strong>Gaplytiq</strong>. This unified operations platform handles candidate slots, real-time proctored examinations, video submissions, and live jury evaluations — all in one seamless flow.
              </p>
            </div>

            <div className="portal-grid">
              <Link href="/college/login" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="portal-card">
                  <div className="ico" style={{ background: "rgba(249,97,103,.18)", color: "var(--coral)" }}>🏫</div>
                  <h3>College Admin</h3>
                  <p>Upload student teams, appoint jury, flag off rounds, and track everything on a live dashboard.</p>
                  <div className="enter">Enter portal →</div>
                </div>
              </Link>
              <Link href="/jury/login" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="portal-card">
                  <div className="ico" style={{ background: "rgba(242,201,76,.2)", color: "#B8860B" }}>⚖️</div>
                  <h3>Jury</h3>
                  <p>Review team submissions round by round, approve content, and score against contest criteria.</p>
                  <div className="enter">Enter portal →</div>
                </div>
              </Link>
              <Link href="/student/login" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="portal-card">
                  <div className="ico" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>🎓</div>
                  <h3>Student</h3>
                  <p>Log in with OTP, see your test slot, take Round 1, and submit your Reel for Rounds 2 & 3.</p>
                  <div className="enter">Enter portal →</div>
                </div>
              </Link>
            </div>
            

          </div>
        </div>
      </div>
    </>
  );
}

