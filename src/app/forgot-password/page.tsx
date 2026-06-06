"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#f8fafc",
        }}
      >
        <div className="card" style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--slate-800)",
              marginBottom: "8px",
            }}
          >
            Check your email
          </h1>
          <p style={{ fontSize: "14px", color: "var(--slate-500)", marginBottom: "24px" }}>
            If that email exists in our system, we&apos;ve sent a password reset link to it.
          </p>
          <p style={{ fontSize: "13px", color: "var(--slate-400)" }}>
            Remember your password?{" "}
            <a href="/login" style={{ color: "var(--primary)", fontWeight: "500" }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "#f8fafc",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "var(--slate-800)",
            }}
          >
            Forgot password
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--slate-500)",
              marginTop: "8px",
            }}
          >
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "var(--slate-500)",
            marginTop: "24px",
          }}
        >
          Remember your password?{" "}
          <a
            href="/login"
            style={{ color: "var(--primary)", fontWeight: "500" }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
