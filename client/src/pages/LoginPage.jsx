import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { PageShell } from "../components/PageShell";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const looksLikeEmail = normalizedIdentifier.includes("@");
      const data = await authService.login({
        email: looksLikeEmail ? normalizedIdentifier : "",
        username: normalizedIdentifier,
        password
      });
      login(data);
      if (data.user.role === "super-admin") {
        navigate("/super-admin");
      } else {
        if (data.user.role === "admin") {
          navigate(data.user.authType === "platform-admin" ? "/admin/teams" : "/admin");
        } else {
          navigate("/candidate");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="auth-card">
        <h1>Welcome Back</h1>
        <p>Sign in to access your account</p>
        <form onSubmit={onSubmit} className="form-grid">
          <div>
            <label htmlFor="identifier" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>Email or Username</label>
            <input
              id="identifier"
              placeholder="Enter your email or username"
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
          Don't have an account? <Link to="/signup">Create one here</Link>
        </p>
      </section>
    </PageShell>
  );
};
