"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  college: string;
  slotId: string | null;
}

function SelectSlotContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!studentId) {
      setError("No student ID found in the link. Please check your email.");
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/students/${studentId}`);
        const data = await res.json();
        if (data.success) {
          setStudent(data.student);
          if (data.student.slotId) {
            setSelectedSlot(data.student.slotId);
          }
        } else {
          setError(data.error || "Could not retrieve student details.");
        }
      } catch (err) {
        setError("Network error: Could not fetch student details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSlots = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/slots");
        const data = await res.json();
        if (data.success) {
          setSlots(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch slots");
      }
    };

    fetchStudent();
    fetchSlots();
  }, [studentId]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError("Please pick a slot before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/select-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to save slot selection.");
      }
    } catch (err) {
      setError("Network error: Could not submit slot choice.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-wrap" style={{ justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ color: "var(--slate-2)", fontSize: 16 }}>Loading profile details...</div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="login-wrap" style={{ justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="login-box" style={{ maxWidth: 450, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Invalid Link</h3>
          <p style={{ color: "var(--slate-2)", fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-wrap" style={{ justifyContent: "center", minHeight: "90vh" }}>
        <div className="login-box" style={{ maxWidth: 500, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🎉</div>
          <h3 style={{ fontSize: 24, marginBottom: 8 }}>Slot Confirmed!</h3>
          <p style={{ color: "var(--slate-2)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Thank you, <strong>{student?.name}</strong>. Your test slot has been saved successfully as:
          </p>
          <div style={{ background: "#FCFBFA", border: "1px solid var(--line)", padding: 16, borderRadius: 12, marginBottom: 30 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--slate-2)", fontWeight: 700 }}>Chosen Slot</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-2)", marginTop: 6 }}>
              {slots.find(s => s.id === selectedSlot)?.time}
            </div>
          </div>
          <p style={{ color: "var(--slate-2)", fontSize: 12.5 }}>
            You can now close this tab. You can use your registered email to log into the Student Portal on the competition day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap" style={{ justifyContent: "center", minHeight: "90vh" }}>
      <div className="login-box" style={{ maxWidth: 520, padding: 36 }}>
        <div className="brand" style={{ marginBottom: 24 }}>
          <div className="mark">M</div>
          <div>
            <div className="name">MarkUp</div>
            <div className="sub">Concept to Campaign</div>
          </div>
        </div>

        <h3 style={{ fontSize: 22, marginBottom: 6 }}>Select Your Test Slot</h3>
        <p style={{ color: "var(--slate-2)", fontSize: 13, marginBottom: 20 }}>
          Hi <strong>{student?.name}</strong> from <strong>{student?.college}</strong>. Please pick one of the available test slots for the individual test round.
        </p>

        {error && (
          <div style={{ padding: 12, background: "var(--red-bg)", borderRadius: 8, fontSize: 13, color: "var(--red)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {slots.map((s) => {
            const isFull = s.filled >= s.capacity;
            const isSelected = selectedSlot === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  if (!isFull) setSelectedSlot(s.id);
                }}
                style={{
                  padding: "16px 20px",
                  border: isSelected ? "2px solid var(--coral)" : "1px solid var(--line)",
                  borderRadius: 12,
                  background: isSelected ? "#FFF9F9" : (isFull ? "#f5f5f5" : "#ffffff"),
                  cursor: isFull ? "not-allowed" : "pointer",
                  display: "flex",
                  justifyContent: "between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                  opacity: isFull && !isSelected ? 0.6 : 1
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: isSelected ? "var(--coral)" : "var(--slate-2)", letterSpacing: 0.5 }}>
                    Slot {s.id}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--navy-2)", marginTop: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: isFull ? "var(--red)" : "var(--green)", marginTop: 4 }}>
                    {isFull ? "Full" : `${s.filled}/${s.capacity} Filled`}
                  </div>
                </div>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: isSelected ? "6px solid var(--coral)" : "2px solid var(--line)",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }} />
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-coral btn-block"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ height: 46 }}
        >
          {submitting ? "Saving choice..." : "Confirm Slot Selection"}
        </button>
      </div>
    </div>
  );
}

export default function SelectSlotPage() {
  return (
    <Suspense fallback={
      <div className="login-wrap" style={{ justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ color: "var(--slate-2)", fontSize: 16 }}>Initializing slot selection...</div>
      </div>
    }>
      <SelectSlotContent />
    </Suspense>
  );
}
