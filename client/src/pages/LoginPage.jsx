import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { loginTeam } from "../services/api";
import { PageShell } from "../components/PageShell";

const ROLE_LABELS = {
  student: "Student",
  team: "Team",
  admin: "Admin"
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const roleFromQuery = String(searchParams.get("role") || "").toLowerCase();
  const initialRole = ["student", "team", "admin"].includes(roleFromQuery)
    ? roleFromQuery
    : "student";
  const [loginType, setLoginType] = useState(initialRole);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedIdentifier = identifier.trim();
      if (loginType === "team") {
        const data = await loginTeam({
          username: normalizedIdentifier,
          password
        });

        login({
          token: data?.token,
          user: {
            role: "team",
            team: data?.team
          }
        });

        navigate("/team/dashboard", { replace: true });
      } else {
        const looksLikeEmail = normalizedIdentifier.includes("@");
        const data = await authService.login({
          email: looksLikeEmail ? normalizedIdentifier : "",
          username: normalizedIdentifier,
          password
        });

        if (loginType === "student" && data?.user?.role !== "candidate") {
          throw new Error("Selected Student login, but credentials are not a student account.");
        }

        if (loginType === "admin" && !["admin", "super-admin"].includes(data?.user?.role)) {
          throw new Error("Selected Admin login, but credentials are not an admin account.");
        }

        login(data);

        if (data.user.role === "super-admin") {
          navigate("/super-admin", { replace: true });
        } else {
          if (data.user.role === "admin") {
            navigate(data.user.authType === "platform-admin" ? "/admin/teams" : "/admin", { replace: true });
          } else {
            navigate("/candidate", { replace: true });
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="auth-card">
        <h1>Welcome Back</h1>
        <p>Choose your portal and sign in</p>
        <form onSubmit={onSubmit} className="form-grid">
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Login As
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {Object.keys(ROLE_LABELS).map((roleKey) => (
                <label key={roleKey} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <input
                    type="radio"
                    name="loginType"
                    value={roleKey}
                    checked={loginType === roleKey}
                    onChange={(e) => setLoginType(e.target.value)}
                  />
                  {ROLE_LABELS[roleKey]}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="identifier" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              {loginType === "team" ? "Team Name" : "Email or Username"}
            </label>
            <input
              id="identifier"
              placeholder={loginType === "team" ? "Enter your team name" : "Enter your email or username"}
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
            <input
              id="password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          Don't have an account? <Link to={`/signup?role=${loginType === "student" ? "candidate" : loginType}`}>Create one here</Link>
        </p>
      </section>
    </PageShell>
  );
};
