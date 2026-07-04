"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStateContext } from "@/context/StateContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { addToast } = useStateContext();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated (Supabase parses hash automatically)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionActive(true);
      } else {
        // Wait briefly for hash parsing to finish in case of redirect delay
        setTimeout(async () => {
          const { data: { secondSession } } = await supabase.auth.getSession() as any;
          if (secondSession) {
            setSessionActive(true);
          }
        }, 1500);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      addToast("Password cannot be empty.", "error");
      return;
    }

    if (password !== confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) {
        addToast(`Failed to update password: ${error.message}`, "error");
      } else {
        addToast("Password set successfully! You can now log in.", "success");
        // Sign out to clear the temporary invite session
        await supabase.auth.signOut();
        router.push("/jury/login");
      }
    } catch (err: any) {
      addToast("An unexpected error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "var(--navy)" }}>
      <div className="card card-pad" style={{ width: "100%", maxWidth: "400px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "8px", color: "var(--navy)" }}>Set Your Password</h2>
        <p style={{ fontSize: "14px", color: "var(--slate-2)", marginBottom: "24px" }}>
          Create a secure password for your Jury Panel account.
        </p>

        <form onSubmit={handleResetPassword}>
          <div className="form-group" style={{ position: "relative" }}>
            <label>New Password</label>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ paddingRight: "60px" }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "10px", top: "33px", background: "none", border: "none", color: "var(--slate-2)", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label>Confirm Password</label>
            <input
              className="input"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              style={{ paddingRight: "60px" }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: "absolute", right: "10px", top: "33px", background: "none", border: "none", color: "var(--slate-2)", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
              tabIndex={-1}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            className="btn btn-coral btn-block"
            type="submit"
            disabled={loading}
            style={{ marginTop: "16px" }}
          >
            {loading ? "Saving password..." : "Confirm & Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
