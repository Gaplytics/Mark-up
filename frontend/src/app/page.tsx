"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [activeRound, setActiveRound] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const rounds = [
    {
      id: 1,
      number: "Day 1 | Round 1",
      title: "MARKETING APTITUDE CHALLENGE",
      date: "8 July 2026",
      desc: "A rigorous online proctored assessment designed to evaluate candidates' understanding of foundational marketing concepts, brand mechanics, and strategic business scenario solving.",
      points: [
        "Marketing Fundamentals: 4Ps, STP, product lifecycle, pricing matrices.",
        "Brand Strategy: Brand equity, differentiation, positioning strategies.",
        "Consumer Behaviour: Psychological drivers, decision journeys, market trends.",
        "Digital Channels: SEO/SEM principles, performance marketing analytics, attribution.",
        "Business Case Solving: Real-world problems requiring rapid qualitative decisions."
      ],
      duration: "60 Minutes Online Test",
      output: "Top-scoring candidates & pre-formed teams advance to Round 2.",
      icon: "🧠",
      accent: "#E28743"
    },
    {
      id: 2,
      number: "Day 2 – 14 | Round 2",
      title: "90 SECOND REEL CHALLENGE",
      date: "9 – 14 July 2026",
      desc: "Teams conceptualize, script, shoot, edit, and post a high-conversion 90-second marketing video creative to test real-world social engagement and storytelling capabilities.",
      points: [
        "Product Launch & Teaser Video: Generating hype for a new concept.",
        "Brand Awareness Campaign: Crafting emotional resonance and memory hook.",
        "Social Media Storytelling: Leveraging organic trends and editing tricks.",
        "Performance Ad Creative: Hook-driven copy, crisp pacing, and strong Call-To-Action."
      ],
      submission: "Direct Submission of Instagram Reel / YouTube Shorts URL",
      output: "Submissions evaluated by faculty judges to select Grand Finalists.",
      icon: "🎬",
      accent: "#FF5E36"
    },
    {
      id: 3,
      number: "Day 3 | Demo Day",
      title: "CAMPAIGN SHOWCASE & JURY PITCH",
      date: "15 July 2026",
      desc: "The Grand Finale of MarkUp 2026. Selected finalist teams pitch their comprehensive end-to-end marketing campaign strategy to an expert industry jury panel.",
      points: [
        "Campaign Objective & Target Persona Profile: Clear demographic and psychographic targeting.",
        "Omnichannel Distribution Plan: Strategy across digital, physical, and community channels.",
        "Budgeting & Impact Analysis: Cost allocations, success metrics, and projected ROI."
      ],
      format: "5 Minutes Pitch + 3 Minutes Q&A",
      output: "Live leaderboard updates determine the champions of MarkUp 2026.",
      icon: "📢",
      accent: "#F59E0B"
    }
  ];

  const criteria = [
    {
      title: "Creativity & Originality",
      percentage: "25%",
      desc: "Evaluates the uniqueness of the concept, script originality, and the overall 'wow factor' of the marketing angles.",
      details: ["Hook Strength", "Conceptual Novelty", "Visual Innovation"],
      icon: "💡",
      color: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.3)"
    },
    {
      title: "Marketing Strategy",
      percentage: "25%",
      desc: "Assesses how effectively the campaign targets the ideal audience and aligns with brand values and positioning.",
      details: ["Target Persona Fit", "Positioning Logic", "Competitor Contrast"],
      icon: "📈",
      color: "rgba(79, 70, 229, 0.15)",
      border: "rgba(79, 70, 229, 0.3)"
    },
    {
      title: "Content Execution",
      percentage: "25%",
      desc: "Measures visual pacing, editing precision, audio-visual synchronization, and professional execution quality.",
      details: ["Audio/Video Sync", "Pacing & Editing Flow", "Visual Clarity"],
      icon: "🎬",
      color: "rgba(249, 97, 103, 0.15)",
      border: "rgba(249, 97, 103, 0.3)"
    },
    {
      title: "Pitch & Communication",
      percentage: "25%",
      desc: "Scores the team's live pitch clarity, slide structuring, confidence, and how effectively they handle jury Q&A.",
      details: ["Presentation Structure", "Confidence & Delivery", "Q&A Adaptability"],
      icon: "📢",
      color: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)"
    }
  ];

  const faqs = [
    {
      q: "Who is eligible to join MarkUp 2026?",
      a: "All enrolled students at Alliance University across all departments (Business, Engineering, Law, Liberal Arts, etc.) are eligible to participate."
    },
    {
      q: "What is the team size requirement?",
      a: "Teams can consist of 1 to 5 members. You can register your pre-formed team or register individually, and the system/admin can assist in teaming up unassigned students."
    },
    {
      q: "How does the proctored test in Round 1 work?",
      a: "It is an online test consisting of marketing questions and short business scenarios. You will sign in with your phone number via OTP to take the test inside the student portal during your allocated slot."
    },
    {
      q: "How do we submit our Reel for Round 2?",
      a: "Once Round 2 is active, your student dashboard will show a submission card. Simply upload or paste your Instagram Reel or YouTube Shorts URL. The Jury will instantly receive it for grading."
    },
    {
      q: "How are the winners decided?",
      a: "The final scores are based on your cumulative performance, with the Grand Finale presentation scoring contributing heavily. The live leaderboard will show the final rankings."
    }
  ];

  return (
    <div id="screen-landing" style={{ position: "relative", width: "100%", maxWidth: "100vw", background: "#060A13", minHeight: "100vh", color: "#FFFFFF", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      
      {/* Dynamic Keyframes injected into landing page scope */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .animate-slideup {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .draw-under {
          position: relative;
        }
        .draw-under::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          height: 3px;
          background: #FF5E36;
          animation: drawLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Decorative Background Glows */}
      <div className="animate-pulse-glow" style={{
        position: "absolute",
        top: "-150px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "1200px",
        height: "750px",
        background: "radial-gradient(circle, rgba(79, 70, 229, 0.16) 0%, rgba(249, 97, 103, 0.08) 45%, transparent 70%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>

      <div className="animate-pulse-glow" style={{
        position: "absolute",
        top: "800px",
        right: "-200px",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
        filter: "blur(130px)",
        pointerEvents: "none",
        zIndex: 0,
        animationDelay: "-3s"
      }}></div>

      <div className="animate-pulse-glow" style={{
        position: "absolute",
        bottom: "200px",
        left: "-250px",
        width: "700px",
        height: "700px",
        background: "radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, transparent 70%)",
        filter: "blur(130px)",
        pointerEvents: "none",
        zIndex: 0,
        animationDelay: "-1.5s"
      }}></div>

      <div className="container" style={{ position: "relative", zIndex: 1, paddingBottom: "100px" }}>
        
        {/* Navigation Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #FF5E36, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(255, 94, 54, 0.25)" }}>
              <img src="/logo-icon.png" alt="Logo" style={{ width: "22px", height: "22px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center" }}>
                MarkUp <span style={{ color: "#FF5E36", fontSize: "11px", fontWeight: "800", marginLeft: "6px", background: "rgba(255,94,54,0.12)", padding: "2px 6px", borderRadius: "4px" }}>2026</span>
              </div>
              <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#94A3B8", textTransform: "uppercase", fontWeight: "700" }}>Concept to Campaign</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255, 255, 255, 0.03)", padding: "6px 16px", borderRadius: "100px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <img src="/allianceuniversity.png" alt="Alliance University" style={{ height: "30px", objectFit: "contain" }} />
              <div style={{ width: "1px", height: "18px", background: "rgba(255, 255, 255, 0.15)" }}></div>
              <img src="/gaplytiq.png" alt="Gaplytiq" style={{ height: "45px", objectFit: "contain" }} />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="animate-slideup" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "50px", padding: "80px 0 60px", alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 94, 54, 0.08)", padding: "6px 14px", borderRadius: "100px", border: "1px solid rgba(255, 94, 54, 0.2)", marginBottom: "24px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF5E36", boxShadow: "0 0 8px #FF5E36" }}></span>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase", color: "#FF5E36" }}>Alliance University Marketing Club Presents</span>
            </div>

            <div style={{ position: "relative", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "82px", fontWeight: "950", color: "#FFFFFF", lineHeight: "0.9", letterSpacing: "-2.5px" }}>
                MARK<span style={{ color: "#FF5E36", position: "relative" }} className="draw-under">UP<span style={{ position: "absolute", right: "-35px", top: "-15px", color: "#FF5E36", fontSize: "54px", transform: "rotate(45deg)" }}>↑</span></span>
              </h1>
              <div style={{ display: "inline-block", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "8px", padding: "6px 14px", marginTop: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#E28743", letterSpacing: "1.5px" }}>THE ULTIMATE MARKETING HACKATHON</span>
              </div>
            </div>

            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#FFFFFF", marginBottom: "24px", fontFamily: "inherit", opacity: 0.9 }}>
              Where Creativity Meets Strategy.
            </h2>
            <p style={{ fontSize: "18px", color: "#B9C6EB", maxWidth: "640px", lineHeight: "1.65", marginBottom: "40px" }}>
              A high-octane 5-day marketing competition challenge to benchmark your brand positioning, social media storytelling, editing flair, and presentation prowess. Translate creative concepts into fully realized campaigns.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/student/login" style={{ textDecoration: "none" }}>
                <button style={{ background: "linear-gradient(135deg, #FF5E36 0%, #FF2E93 100%)", color: "#FFFFFF", border: "none", padding: "16px 32px", borderRadius: "14px", fontWeight: "800", fontSize: "15.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 6px 25px rgba(255, 94, 54, 0.35)", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(255, 94, 54, 0.5)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 25px rgba(255, 94, 54, 0.35)"; }}>
                  🎓 Student Sign In
                </button>
              </Link>
              <Link href="/college/login" style={{ textDecoration: "none" }}>
                <button style={{ background: "rgba(255, 255, 255, 0.04)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "16px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  🏫 College Admin
                </button>
              </Link>
              <Link href="/jury/login" style={{ textDecoration: "none" }}>
                <button style={{ background: "rgba(255, 255, 255, 0.04)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "16px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  ⚖️ Jury Panel
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Info Box (Flyer-inspired) */}
          <div className="animate-float" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px", padding: "35px", backdropFilter: "blur(20px)", boxShadow: "0 20px 45px rgba(0, 0, 0, 0.4)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-15px", right: "20px", background: "linear-gradient(135deg, #FF5E36, #FF2E93)", color: "#FFFFFF", fontWeight: "900", fontSize: "11px", padding: "4px 14px", borderRadius: "20px", letterSpacing: "1px" }}>REGISTRATION LIVE</div>
            
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", marginBottom: "25px", display: "flex", alignItems: "center", gap: "8px" }}>
              📋 Quick Overview
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(226, 135, 67, 0.12)", color: "#E28743", display: "flex", alignItems: "center", fontSize: "20px", flexShrink: 0, justifyContent: "center" }}>📅</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>8th – 11th July 2026</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Intense 5-day competitive format</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(79, 70, 229, 0.12)", color: "#818CF8", display: "flex", alignItems: "center", fontSize: "20px", flexShrink: 0, justifyContent: "center" }}>📍</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>Alliance University campus</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Open to all registered university departments</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255, 94, 54, 0.12)", color: "#FF5E36", display: "flex", alignItems: "center", fontSize: "20px", flexShrink: 0, justifyContent: "center" }}>👥</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>Teams of 1 to 5 members</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Collaborate or complete solo assessments</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "30px", paddingTop: "24px", display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "800", color: "#E28743", letterSpacing: "1px" }}>
              <span>💡 THINK</span>
              <span>✏️ CREATE</span>
              <span>📢 PITCH</span>
            </div>
          </div>
        </section>

        {/* Feature Icons Bar */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", padding: "40px 0", borderTop: "1px solid rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ fontSize: "36px" }}>🧠</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#FFFFFF" }}>Showcase Creativity</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Push concepts to maximum brand recall.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ fontSize: "36px" }}>📊</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#FFFFFF" }}>Test Marketing Aptitude</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Evaluate scenario analysis under time limits.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ fontSize: "36px" }}>📢</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#FFFFFF" }}>Pitch to Real Brands</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Defend campaign structures to the expert jury.</div>
            </div>
          </div>
        </section>

        {/* Timeline Journey Section */}
        <section style={{ padding: "80px 0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "45px" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#FF5E36", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: "10px" }}>Contest Architecture</div>
            <h2 style={{ fontSize: "38px", fontWeight: "900", color: "#FFFFFF" }}>
              The Challenge Journey
            </h2>
            <p style={{ fontSize: "15px", color: "#94A3B8", marginTop: "10px", maxWidth: "600px", margin: "10px auto 0" }}>
              Markup 2026 structured in 3 modular phases testing core digital skills. Click the tabs below to explore.
            </p>
          </div>

          {/* Interactive Navigation Timeline */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "35px" }}>
            {rounds.map((round, idx) => (
              <button
                key={round.id}
                onClick={() => setActiveRound(idx)}
                style={{
                  background: activeRound === idx ? "rgba(255, 94, 54, 0.08)" : "transparent",
                  color: activeRound === idx ? "#FF5E36" : "#94A3B8",
                  border: activeRound === idx ? "1px solid rgba(255, 94, 54, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "14px 28px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                {round.number.split(" | ")[1] || round.number}
              </button>
            ))}
          </div>

          {/* Detailed Informational Active Card with Fade Animation */}
          <div key={activeRound} className="animate-fadein" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "24px", padding: "40px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "50px", alignItems: "center", minHeight: "380px" }}>
            <div>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "11px", fontWeight: "800", color: rounds[activeRound].accent, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>
                {rounds[activeRound].number}
              </div>
              <h3 style={{ fontSize: "30px", fontWeight: "900", color: "#FFFFFF", marginBottom: "12px", lineHeight: "1.2" }}>
                {rounds[activeRound].title}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E28743", fontWeight: "800", fontSize: "14.5px", marginBottom: "20px" }}>
                <span>📅 Timeline: {rounds[activeRound].date}</span>
              </div>
              <p style={{ fontSize: "15.5px", color: "#AEB9E1", lineHeight: "1.65", marginBottom: "24px" }}>
                {rounds[activeRound].desc}
              </p>

              {rounds[activeRound].submission && (
                <div style={{ background: "rgba(255, 94, 54, 0.03)", border: "1px solid rgba(255, 94, 54, 0.1)", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#FF5E36", letterSpacing: "1.5px", textTransform: "uppercase" }}>Submission Format</div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#FFFFFF", marginTop: "4px" }}>{rounds[activeRound].submission}</div>
                </div>
              )}

              {rounds[activeRound].duration && (
                <div style={{ background: "rgba(226, 135, 67, 0.03)", border: "1px solid rgba(226, 135, 67, 0.1)", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#E28743", letterSpacing: "1.5px", textTransform: "uppercase" }}>Duration Details</div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#FFFFFF", marginTop: "4px" }}>{rounds[activeRound].duration}</div>
                </div>
              )}

              {rounds[activeRound].format && (
                <div style={{ background: "rgba(245, 158, 11, 0.03)", border: "1px solid rgba(245, 158, 11, 0.1)", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#F59E0B", letterSpacing: "1.5px", textTransform: "uppercase" }}>Presentation Format</div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#FFFFFF", marginTop: "4px" }}>{rounds[activeRound].format}</div>
                </div>
              )}

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", letterSpacing: "1px", textTransform: "uppercase" }}>Phase Output target</div>
                <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#FFFFFF", marginTop: "4px" }}>{rounds[activeRound].output}</div>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.015)", border: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "20px", padding: "30px", position: "relative" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                🎯 Focus Areas & Topics:
              </h4>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {rounds[activeRound].points.map((pt, i) => (
                  <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "14.5px", color: "#AEB9E1" }}>
                    <span style={{ color: rounds[activeRound].accent, fontWeight: "bold" }}>✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: "90px", position: "absolute", bottom: "10px", right: "20px", opacity: 0.07, pointerEvents: "none" }}>
                {rounds[activeRound].icon}
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation Rubrics Grid */}
        <section style={{ padding: "60px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "45px" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#FF5E36", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: "10px" }}>Evaluation Rubric</div>
            <h2 style={{ fontSize: "38px", fontWeight: "900", color: "#FFFFFF" }}>
              Contest Scoring Matrix
            </h2>
            <p style={{ fontSize: "15px", color: "#94A3B8", marginTop: "10px" }}>
              All participant submissions are graded objectively based on 4 metrics weighted at 25% each.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {criteria.map((c, i) => (
              <div key={i} style={{ background: "rgba(255, 255, 255, 0.01)", border: `1px solid ${c.border}`, borderRadius: "18px", padding: "26px", transition: "transform 0.25s, background-color 0.25s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.01)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ fontSize: "30px" }}>{c.icon}</span>
                  <span style={{ background: c.color, border: `1px solid ${c.border}`, color: "#FFFFFF", fontWeight: "800", fontSize: "13px", padding: "3px 9px", borderRadius: "6px" }}>{c.percentage}</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", marginBottom: "12px" }}>{c.title}</h3>
                <p style={{ fontSize: "13.5px", color: "#AEB9E1", lineHeight: "1.5", marginBottom: "18px" }}>{c.desc}</p>
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "14px" }}>
                  <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>Key Indicators</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {c.details.map((d, idx) => (
                      <span key={idx} style={{ fontSize: "10.5px", background: "rgba(255, 255, 255, 0.04)", padding: "2px 8px", borderRadius: "4px", color: "#AEB9E1" }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accordion FAQ Section */}
        <section style={{ padding: "60px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "45px" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#FF5E36", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: "10px" }}>Information Desk</div>
            <h2 style={{ fontSize: "38px", fontWeight: "900", color: "#FFFFFF" }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: "15px", color: "#94A3B8", marginTop: "10px" }}>
              Got questions? We've got answers on operations, rules, and timelines.
            </p>
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>
            {faqs.map((faq, idx) => {
              const isSelected = openFaq === idx;
              return (
                <div key={idx} style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "14px", overflow: "hidden", transition: "all 0.2s" }}>
                  <button
                    onClick={() => setOpenFaq(isSelected ? null : idx)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "#FFFFFF",
                      padding: "20px 24px",
                      textAlign: "left",
                      fontSize: "15.5px",
                      fontWeight: "700",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: "18px", transition: "transform 0.2s", transform: isSelected ? "rotate(45deg)" : "rotate(0deg)", color: "#FF5E36" }}>+</span>
                  </button>
                  {isSelected && (
                    <div className="animate-fadein" style={{ padding: "0 24px 20px", color: "#AEB9E1", fontSize: "14.5px", lineHeight: "1.6", borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "14px" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section style={{ marginTop: "60px", background: "linear-gradient(135deg, rgba(255, 94, 54, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%)", border: "1px solid rgba(255, 94, 54, 0.25)", borderRadius: "24px", padding: "60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="animate-pulse-glow" style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(255, 94, 54, 0.2)", filter: "blur(45px)", borderRadius: "50%" }}></div>
          <div className="animate-pulse-glow" style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "150px", height: "150px", background: "rgba(79, 70, 229, 0.2)", filter: "blur(45px)", borderRadius: "50%", animationDelay: "-2s" }}></div>

          <h2 style={{ fontSize: "42px", fontWeight: "950", color: "#FFFFFF", letterSpacing: "1px", marginBottom: "14px" }}>
            THINK. CREATE. PITCH. WIN.
          </h2>
          <p style={{ fontSize: "16px", color: "#C7CDE8", maxWidth: "600px", margin: "0 auto 35px", lineHeight: "1.6" }}>
            Sign in to coordinate test slots, access Round 1, and upload your team's Reel submission.
          </p>

          <Link href="/student/login" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FFFFFF", color: "#060A13", border: "none", padding: "16px 36px", borderRadius: "12px", fontWeight: "800", fontSize: "15.5px", cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              Go to Dashboard →
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ marginTop: "80px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "30px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: "#E28743", letterSpacing: "1.2px" }}>
            AN INITIATIVE BY ALLIANCE UNIVERSITY MARKETING CLUB
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "12px" }}>
            © {new Date().getFullYear()} MarkUp 2026. Unified Hackathon Operations Platform. Powered by Gaplytiq.
          </div>
        </footer>

      </div>
    </div>
  );
}
