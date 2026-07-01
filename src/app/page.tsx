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
                <div className="mark">M</div>
                <div>
                  <div className="name">MarkUp</div>
                  <div className="sub">Concept to Campaign</div>
                </div>
              </div>
              <div className="pill-row" style={{ marginTop: 0, alignItems: "center" }}>
                <img src="/allianceuniversity.png" alt="Alliance University" style={{ height: 38, objectFit: "contain" }} />
                <img src="/gaplytiq.png" alt="Powered by Gaplytiq" style={{ height: 32, objectFit: "contain" }} />
              </div>
            </div>

            <div className="landing-hero">
              <div className="eyebrow">Contest Operations Platform</div>
              <h1>One platform to run MarkUp — from registration to results.</h1>
              <p>Colleges manage groups and judges, students take the test and submit content in their slot, and jury score and approve every round — all in real time.</p>
            </div>

            <div className="portal-grid">
              <Link href="/college/login" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="portal-card">
                  <div className="ico" style={{ background: "rgba(249,97,103,.18)", color: "var(--coral)" }}>🏫</div>
                  <h3>College Admin</h3>
                  <p>Upload student groups, appoint jury, flag off rounds, and track everything on a live dashboard.</p>
                  <div className="enter">Enter portal →</div>
                </div>
              </Link>
              <Link href="/jury/login" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="portal-card">
                  <div className="ico" style={{ background: "rgba(242,201,76,.2)", color: "#B8860B" }}>⚖️</div>
                  <h3>Jury</h3>
                  <p>Review group submissions round by round, approve content, and score against contest criteria.</p>
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
