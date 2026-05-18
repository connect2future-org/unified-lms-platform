import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

export const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Force role to always be candidate
    setForm((prev) => ({
      ...prev,
      role: "candidate"
    }));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.signup(form);
      login(data);
      if (data.user.role === "super-admin") {
        navigate("/super-admin");
      } else {
        navigate(data.user.role === "admin" ? "/admin" : "/candidate");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>Create Account</h1>
      <form onSubmit={onSubmit} className="form-grid">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" disabled={loading}>
          {loading ? "Please wait..." : "Signup"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
