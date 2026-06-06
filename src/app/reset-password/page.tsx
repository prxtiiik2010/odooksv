"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setInvalid(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("Password must contain at least one special character");
      return;
    }

    setLoading(true);

    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
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
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--slate-800)",
              marginBottom: "12px",
            }}
          >
            Invalid reset link
          </h1>
          <p style={{ fontSize: "14px", color: "var(--slate-500)", marginBottom: "24px" }}>
            This password reset link has expired or is invalid.
          </p>
          <a href="/forgot-password" className="btn btn-primary">
            Request new link
          </a>
        </div>
      </div>
    );
  }

  if (done) {
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
            Password reset
          </h1>
          <p style={{ fontSize: "14px", color: "var(--slate-500)", marginBottom: "24px" }}>
            Your password has been reset successfully.
          </p>
          <a href="/login" className="btn btn-primary">
            Sign in
          </a>
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
            Set new password
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--slate-500)",
              marginTop: "8px",
            }}
          >
            Choose a strong password for your account
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
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
