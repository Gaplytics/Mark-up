"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStateContext } from "@/context/StateContext";

export interface CollegeData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  created_at?: string;
}

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const { addToast } = useStateContext();

  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Authentication check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("superadmin_authenticated");
      if (isAuth !== "true") {
        router.push("/superadmin/login");
      }
    }
  }, [router]);

  // Load colleges
  const loadColleges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/colleges`);
      const json = await res.json();
      if (json.success) {
        setColleges(json.data);
      } else {
        addToast("Failed to load colleges from database.", "error");
      }
    } catch (err) {
      addToast("Network error: Could not connect to backend.", "error");
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      addToast("Please fill in all fields.", "error", "Missing Information");
      return;
    }

    setIsSubmitting(true);
    const newCollege: CollegeData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/colleges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollege),
      });
      const json = await res.json();
      if (json.success) {
        addToast(`${name} has been registered successfully in database.`, "success", "College Registered");
        setName("");
        setEmail("");
        setPassword("");
        loadColleges();
      } else {
        addToast(`Failed to register college: ${json.error}`, "error", "Registration Failed");
      }
    } catch (err) {
      addToast("Network error: Could not connect to backend.", "error", "Registration Failed");
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("superadmin_authenticated");
    }
    addToast("Logged out successfully.", "success");
    router.push("/superadmin/login");
  };

  return (
    <div id="screen-superadmin-dashboard">
      <div className="app-shell">
        {/* Sidebar */}
        <div className={`sidebar ${!isSidebarOpen ? "collapsed" : ""}`}>
          <div style={{ display: "flex", justifyContent: isSidebarOpen ? "flex-end" : "center", marginBottom: 16 }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: "transparent", border: "none", color: "#C7CDE8", fontSize: 20, cursor: "pointer" }}
              title="Toggle Sidebar"
            >
              ☰
            </button>
          </div>
          <div className="brand">
            <img src="/logo-icon.png" alt="Logo" style={{ width: "30px", height: "30px", marginRight: "8px", objectFit: "contain" }} />
            <div>
              <div className="name">MarkUp</div>
              <div className="sub">Concept to Campaign</div>
            </div>
          </div>
          <div className="side-portal-tag">Superadmin</div>
          <div className="side-nav">
            <div className="side-link active" style={{ cursor: "pointer" }}>
              <span className="dot"></span>
              <span className="lbl">Manage Colleges</span>
            </div>
          </div>
          <div className="side-foot">
            <div className="side-user">
              <div className="avatar">SA</div>
              <div>
                <div className="u-name">Superadmin</div>
                <div className="u-role">Central Controller</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main">
          <div className="topbar">
            <div>
              <h2>Superadmin Dashboard</h2>
              <div className="sub">Register colleges and issue coordinator credentials.</div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {!loading && (
                <span className="badge badge-green" style={{ fontSize: 12 }}>
                  ● Supabase Database Connected
                </span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>

          <div className="content">
            <div className="grid grid-2">
              {/* Left Column: College List */}
              <div className="card card-pad">
                <h3 className="section-title">Registered Colleges</h3>
                <p className="section-desc">View all participating institutions and their credentials.</p>

                {loading ? (
                  <div className="empty">
                    <div className="ico">⏳</div>
                    <div className="t">Loading colleges...</div>
                  </div>
                ) : colleges.length === 0 ? (
                  <div className="empty">
                    <div className="ico">🏫</div>
                    <div className="t">No Colleges Registered Yet</div>
                    <p style={{ color: "var(--slate-2)", fontSize: 13, marginTop: 4 }}>
                      Use the registration form on the right to add the first college.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>College Name</th>
                          <th>Admin Email</th>
                          <th>Password</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map((c, i) => (
                          <tr key={c.id || i}>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            <td style={{ color: "var(--slate)" }}>{c.email}</td>
                            <td>
                              <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                                {c.password}
                              </code>
                            </td>
                            <td style={{ color: "var(--slate-2)", fontSize: 12 }}>
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Register College Form */}
              <div className="card card-pad">
                <h3 className="section-title">Register New College</h3>
                <p className="section-desc">Create coordinator login details for a college campus.</p>

                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>College Name</label>
                    <input
                      className="input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alliance University"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Coordinator Email</label>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@alliance.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Dashboard Password</label>
                    <input
                      className="input"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. SecretPassword@123"
                      required
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={isSubmitting}
                    style={{ marginTop: 24 }}
                  >
                    {isSubmitting ? "Registering..." : "Register College"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
