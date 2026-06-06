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
      router.push("/dashboard").catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand-mark">PF</div>
        <div className="auth-copy">
          <h1>Procurement without the noise.</h1>
          <p>
            Track RFQs, compare quotes, approve vendors, and generate purchase
            orders from one focused workspace.
          </p>
        </div>
        <p style={{ color: "var(--text-soft)", fontSize: "13px", margin: 0 }}>
          ProcureFlow · Vendor workflow management
        </p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div style={{ marginBottom: "26px" }}>
            <h2>Welcome back</h2>
            <p className="subtle">Sign in to continue to your workspace.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <label className="label" htmlFor="password">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginBottom: "7px",
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "22px",
            }}
          >
            New here?{" "}
            <a
              href="/register"
              style={{ color: "var(--text)", fontWeight: 650 }}
            >
              Create an account
            </a>
          </p>

          <div className="demo-box">
            <div
              style={{
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Demo access
            </div>
            <div>
              Admin · <code>admin@company.com</code>
            </div>
            <div>
              Procurement · <code>rajesh@company.com</code>
            </div>
            <div style={{ marginTop: "6px" }}>
              Password · <code>Password123!</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
