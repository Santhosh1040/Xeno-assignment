"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  // If already logged in, skip login
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("xfde-email");
    if (existing) {
      router.replace("/");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    const trimmed = email.trim();
    if (!trimmed) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("xfde-email", trimmed);
    }

    router.replace("/");
  }

  const showError = touched && !email.trim();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 18,
          border: "1px solid #1f2933",
          padding: 24,
          background:
            "radial-gradient(circle at top, rgba(148,163,184,0.15), rgba(15,23,42,1))",
          boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>
          Xeno FDE — Login
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
          Enter your email to access the Shopify analytics dashboard.
          This is a lightweight auth layer for the assignment.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
            Work email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: showError ? "1px solid #f97373" : "1px solid #4b5563",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 14,
              outline: "none",
              marginBottom: 6,
            }}
          />
          {showError && (
            <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 8 }}>
              Please enter an email.
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg, #4f46e5, #22c55e)",
              color: "#f9fafb",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue to dashboard
          </button>

          <p
            style={{
              marginTop: 16,
              fontSize: 11,
              color: "#6b7280",
              lineHeight: 1.4,
            }}
          >
            For the assignment, this acts as a simple email authentication
            layer. In a real system this would integrate with an auth
            provider (e.g. OAuth, magic links, SSO).
          </p>
        </form>
      </div>
    </main>
  );
}
