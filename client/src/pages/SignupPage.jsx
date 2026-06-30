import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const SIGNUP_ROLES = {
  candidate: "Student",
  team: "Team",
  admin: "Admin"
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
    adminCode: "",
    superAdminCode: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const requestedRole = String(searchParams.get("role") || "").toLowerCase();
    const adminCode = String(searchParams.get("adminCode") || "");

    setForm((prev) => ({
      ...prev,
      role: ["candidate", "admin", "team"].includes(requestedRole) ? requestedRole : "candidate",
      adminCode: adminCode || prev.adminCode
    }));
  }, [searchParams]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.role === "team") {
      navigate("/register-team");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === "candidate" && form.adminCode
          ? { adminCode: form.adminCode.trim().toUpperCase() }
          : {}),
        ...(form.role === "admin" && form.superAdminCode
          ? { superAdminCode: form.superAdminCode.trim().toUpperCase() }
          : {})
      };

      const data = await authService.signup(payload);
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
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Create Account As
          </label>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {Object.entries(SIGNUP_ROLES).map(([value, label]) => (
              <label key={value} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
                <input
                  type="radio"
                  name="signupRole"
                  value={value}
                  checked={form.role === value}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {form.role === "team" ? (
          <p>
            Team accounts are created through team registration.
          </p>
        ) : (
          <>
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

            {form.role === "candidate" ? (
              <input
                placeholder="Admin Registration Code (Optional)"
                value={form.adminCode}
                onChange={(e) => setForm((prev) => ({ ...prev, adminCode: e.target.value }))}
              />
            ) : null}

            {form.role === "admin" ? (
              <input
                placeholder="Super Admin Code (Optional)"
                value={form.superAdminCode}
                onChange={(e) => setForm((prev) => ({ ...prev, superAdminCode: e.target.value }))}
              />
            ) : null}
          </>
        )}

        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" disabled={loading}>
          {loading ? "Please wait..." : form.role === "team" ? "Continue to Team Registration" : "Signup"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
