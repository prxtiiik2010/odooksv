"use client";

import { useState } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      login(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
            ProcureFlow
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--slate-500)",
              marginTop: "8px",
            }}
          >
            Sign in to continue
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

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ textAlign: "right" }}>
            <a
              href="/forgot-password"
              style={{
                fontSize: "13px",
                color: "var(--slate-500)",
              }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Signing in..." : "Sign in"}
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
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            style={{ color: "var(--primary)", fontWeight: "500" }}
          >
            Create one
          </a>
        </p>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#f1f5f9",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--slate-600)",
          }}
        >
          <strong>Demo Accounts:</strong>
          <ul style={{ marginTop: "8px", paddingLeft: "16px" }}>
            <li>Procurement Officer: rajesh@company.com</li>
            <li>Approver: priya@company.com</li>
            <li>Vendor: amit@sharmasteel.com</li>
            <li>Admin: admin@company.com</li>
          </ul>
          <p style={{ marginTop: "8px" }}>
            Password: <code>Password123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
