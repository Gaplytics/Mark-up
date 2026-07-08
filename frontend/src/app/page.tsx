"use client";

import React, { useState } from "react";
import Link from "next/link";

// Custom Premium SVG Icons replacing Emojis
const BrainIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3.014 3.014 0 0 1-.14-3.88 2.5 2.5 0 0 1 2.6-4.56A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3.014 3.014 0 0 0 .14-3.88 2.5 2.5 0 0 0-2.6-4.56A2.5 2.5 0 0 0 14.5 2z" />
    <path d="M12 5v14" />
    <path d="M12 12h6" />
    <path d="M12 12H6" />
  </svg>
);

const ClapperboardIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.2 6 3 11l-.9-2.4 17.2-5.1Z" />
    <path d="M4 11V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
    <path d="M2 11h20" />
    <path d="M2 17h20" />
    <path d="M2 14h20" />
    <rect x="2" y="11" width="20" height="10" rx="2" />
  </svg>
);

const MegaphoneIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 11 18-5v12L3 13v-2Z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const LightbulbIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const TrendingUpIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const CalendarIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const MapPinIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const UsersIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GraduationCapIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const SchoolIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="16" />
    <line x1="15" y1="22" x2="15" y2="16" />
    <line x1="9" y1="16" x2="15" y2="16" />
    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
  </svg>
);

const ScaleIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

const ClipboardIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const BarChartIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

const TargetIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const PencilIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const CheckIcon = ({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Map emoji to SVG component
const getEmojiIcon = (emoji: string, size: number = 24, props: React.SVGProps<SVGSVGElement> = {}) => {
  switch (emoji) {
    case "🧠": return <BrainIcon size={size} {...props} />;
    case "🎬": return <ClapperboardIcon size={size} {...props} />;
    case "📢": return <MegaphoneIcon size={size} {...props} />;
    case "💡": return <LightbulbIcon size={size} {...props} />;
    case "📈": return <TrendingUpIcon size={size} {...props} />;
    case "📅": return <CalendarIcon size={size} {...props} />;
    case "📍": return <MapPinIcon size={size} {...props} />;
    case "👥": return <UsersIcon size={size} {...props} />;
    case "🎓": return <GraduationCapIcon size={size} {...props} />;
    case "🏫": return <SchoolIcon size={size} {...props} />;
    case "⚖️": return <ScaleIcon size={size} {...props} />;
    case "📋": return <ClipboardIcon size={size} {...props} />;
    case "📊": return <BarChartIcon size={size} {...props} />;
    case "🎯": return <TargetIcon size={size} {...props} />;
    case "✏️": return <PencilIcon size={size} {...props} />;
    default: return null;
  }
};

export default function LandingPage() {
  const [activeRound, setActiveRound] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const courses = [
    {
      title: "MBA in Business Analytics",
      description: "Master Data-Driven Decision Making",
      url: "https://academy.dalai.in/courses/mba-business-analytics",
      badge: "Analytics",
      accent: "#FF5E36"
    },
    {
      title: "Data Analytics & AI",
      description: "Unleash the Power of Machine Learning",
      url: "https://academy.dalai.in/courses/data-analytics-ai",
      badge: "AI & ML",
      accent: "#4F46E5"
    },
    {
      title: "D2C E-commerce",
      description: "Build & Scale Digital Native Brands",
      url: "https://academy.dalai.in/courses/d2c-ecommerce",
      badge: "E-Commerce",
      accent: "#10B981"
    },
    {
      title: "Performance Marketing",
      description: "Drive High-ROI Growth Campaigns",
      url: "https://academy.dalai.in/courses/performance-marketing",
      badge: "Marketing",
      accent: "#EC4899"
    },
    {
      title: "AI Edge Program",
      description: "Stay Ahead with Generative AI Tools",
      url: "https://academy.dalai.in/courses/ai-edge",
      badge: "Generative AI",
      accent: "#F59E0B"
    }
  ];

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
      number: "Day 2 | Round 2",
      title: "90 SECOND REEL CHALLENGE",
      date: "10 July 2026",
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
      date: "11 July 2026",
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
        @keyframes scrollMarquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(-50% - 6px)); }
        }
        .marquee-vertical {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: scrollMarquee 15s linear infinite;
        }
        .marquee-vertical:hover {
          animation-play-state: paused;
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
            <img src="/logo-icon.png" alt="Logo" style={{ width: "38px", height: "38px", objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center" }}>
                MarkUp <span style={{ color: "#FF5E36", fontSize: "11px", fontWeight: "800", marginLeft: "6px", background: "rgba(255,94,54,0.12)", padding: "2px 6px", borderRadius: "4px" }}>2026</span>
              </div>
              <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#94A3B8", textTransform: "uppercase", fontWeight: "700" }}>Concept to Campaign</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img src="/allianceuniversity.png" alt="Alliance University" style={{ height: "45px", objectFit: "contain" }} />
            <div style={{ width: "1px", height: "18px", background: "rgba(255, 255, 255, 0.15)" }}></div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo-icon.png" alt="Gaplytiq Icon" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>Gaplytiq</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="animate-slideup" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "50px", padding: "80px 0 60px", alignItems: "flex-start" }}>
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
                  <GraduationCapIcon size={20} /> Student Sign In
                </button>
              </Link>
              <Link href="/college/login" style={{ textDecoration: "none" }}>
                <button style={{ background: "rgba(255, 255, 255, 0.04)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "16px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <SchoolIcon size={18} /> College Admin
                </button>
              </Link>
              <Link href="/jury/login" style={{ textDecoration: "none" }}>
                <button style={{ background: "rgba(255, 255, 255, 0.04)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "16px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <ScaleIcon size={18} /> Jury Panel
                </button>
              </Link>
            </div>
            {/* Quick Overview horizontal row (covers the left area under CTAs) */}
            <div style={{ 
              display: "flex", 
              gap: "30px", 
              marginTop: "48px", 
              paddingTop: "32px", 
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: "1 1 200px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(226, 135, 67, 0.12)", color: "#E28743", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>8th – 11th July 2026</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Intense 5-day competitive format</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: "1 1 200px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(79, 70, 229, 0.12)", color: "#818CF8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPinIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>Alliance University campus</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Open to all departments</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: "1 1 200px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255, 94, 54, 0.12)", color: "#FF5E36", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UsersIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>Teams of 1 to 5 members</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>Collaborate or complete solo</div>
                </div>
              </div>
            </div>

            {/* THINK CREATE PITCH Tagline */}
            <div style={{ 
              marginTop: "24px", 
              display: "flex", 
              gap: "24px", 
              fontSize: "11px", 
              fontWeight: "900", 
              color: "#E28743", 
              letterSpacing: "2.5px" 
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><LightbulbIcon size={14} /> THINK</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><PencilIcon size={14} /> CREATE</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MegaphoneIcon size={14} /> PITCH</span>
            </div>
          </div>

          {/* Right Side Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Automatic Scrolling Course Banner (Vertical Ads Marquee) */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.02)", 
              border: "1px solid rgba(255, 255, 255, 0.08)", 
              borderRadius: "24px", 
              padding: "25px", 
              backdropFilter: "blur(20px)", 
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.4)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase", color: "#FF5E36" }}>Specialized Programs</span>
              </div>

              {/* Vertical Scroll Window (Taller to act as billboard sidebar) */}
              <div style={{ width: "100%", height: "360px", overflow: "hidden", position: "relative" }}>
                <div className="marquee-vertical">
                  {[...courses, ...courses].map((course, idx) => (
                    <a 
                      key={idx} 
                      href={course.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        textDecoration: "none",
                        color: "#FFFFFF",
                        transition: "all 0.2s ease-in-out",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; 
                        e.currentTarget.style.borderColor = "var(--coral)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"; 
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Left color tag line */}
                      <div style={{ width: "3px", height: "30px", borderRadius: "1.5px", background: course.accent, flexShrink: 0 }} />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", color: course.accent, letterSpacing: "0.5px" }}>
                          {course.badge}
                        </span>
                        <h4 style={{ fontSize: "13px", fontWeight: "800", margin: "1px 0 0 0", color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.title}
                        </h4>
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.3)", paddingLeft: "4px" }}>→</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            {/* Gaplytiq Promo Banner */}
            <a 
              href="https://gaplytiq.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                textDecoration: "none",
                display: "block"
              }}
            >
              <div 
                style={{ 
                  background: "radial-gradient(circle at top left, rgba(79, 70, 229, 0.15) 0%, rgba(255, 94, 54, 0.05) 50%, rgba(255, 255, 255, 0.01) 100%)",
                  border: "1px solid rgba(79, 70, 229, 0.3)",
                  borderRadius: "24px",
                  padding: "28px",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 20px 45px rgba(79, 70, 229, 0.1)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = "translateY(-4px)"; 
                  e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.6)";
                  e.currentTarget.style.boxShadow = "0 25px 50px rgba(79, 70, 229, 0.2)";
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = "translateY(0)"; 
                  e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.3)";
                  e.currentTarget.style.boxShadow = "0 20px 45px rgba(79, 70, 229, 0.1)";
                }}
              >
                {/* Glowing decorative background orb */}
                <div style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "120px",
                  height: "120px",
                  background: "radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, transparent 70%)",
                  filter: "blur(20px)",
                  pointerEvents: "none"
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", background: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)", color: "#FFFFFF", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" }}>
                    🚀 Free Resource
                  </span>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginBottom: "10px", lineHeight: "1.3" }}>
                  Supercharge Your Career on Gaplytiq
                </h3>

                <p style={{ fontSize: "12.5px", color: "#B9C6EB", lineHeight: "1.55", marginBottom: "20px" }}>
                  Build a professional ATS-friendly resume, take industry skill tests, and get a detailed skill gap analysis—all <strong>100% free</strong>.
                </p>

                <div style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  background: "#4F46E5", 
                  color: "#FFFFFF", 
                  padding: "10px 20px", 
                  borderRadius: "10px", 
                  fontWeight: "800", 
                  fontSize: "13px"
                }}>
                  Get Started on Gaplytiq <span>→</span>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* Feature Icons Bar */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", padding: "40px 0", borderTop: "1px solid rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "14px", background: "rgba(226, 135, 67, 0.08)", border: "1px solid rgba(226, 135, 67, 0.2)", flexShrink: 0 }}>
              <BrainIcon size={28} style={{ color: "#E28743" }} />
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#FFFFFF" }}>Showcase Creativity</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Push concepts to maximum brand recall.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "14px", background: "rgba(129, 140, 248, 0.08)", border: "1px solid rgba(129, 140, 248, 0.2)", flexShrink: 0 }}>
              <BarChartIcon size={28} style={{ color: "#818CF8" }} />
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#FFFFFF" }}>Test Marketing Aptitude</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Evaluate scenario analysis under time limits.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "14px", background: "rgba(255, 94, 54, 0.08)", border: "1px solid rgba(255, 94, 54, 0.2)", flexShrink: 0 }}>
              <MegaphoneIcon size={28} style={{ color: "#FF5E36" }} />
            </div>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CalendarIcon size={16} /> Timeline: {rounds[activeRound].date}</span>
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
                <TargetIcon size={18} style={{ color: rounds[activeRound].accent }} /> Focus Areas & Topics:
              </h4>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {rounds[activeRound].points.map((pt, i) => (
                  <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "14.5px", color: "#AEB9E1" }}>
                    <span style={{ color: rounds[activeRound].accent, display: "flex", alignItems: "center", paddingTop: "2px" }}><CheckIcon size={14} /></span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div style={{ position: "absolute", bottom: "10px", right: "20px", opacity: 0.07, pointerEvents: "none", color: rounds[activeRound].accent }}>
                {getEmojiIcon(rounds[activeRound].icon, 90)}
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
                  <span style={{ display: "flex", alignItems: "center", color: c.border.replace("0.3", "0.85") }}>
                    {getEmojiIcon(c.icon, 28)}
                  </span>
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
