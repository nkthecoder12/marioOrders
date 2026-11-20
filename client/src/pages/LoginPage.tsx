import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("user@demo.com");
  const [password, setPassword] = useState("user123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/menu"} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "admin" ? "/admin" : "/menu", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="text-6xl">🍊</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Mario Juice</h1>
        <p className="mt-1 text-stone-500">Fresh glasses, live tokens.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        <label className="block text-sm font-semibold">
          Email
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-3 outline-none focus:ring-2 focus:ring-orange-400"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-3 outline-none focus:ring-2 focus:ring-orange-400"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-2xl bg-orange-500 text-base font-bold text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="h-11 flex-1 rounded-2xl bg-orange-50 text-xs font-semibold text-orange-700"
            onClick={() => {
              setEmail("user@demo.com");
              setPassword("user123");
            }}
          >
            Customer demo
          </button>
          <button
            type="button"
            className="h-11 flex-1 rounded-2xl bg-lime-50 text-xs font-semibold text-lime-800"
            onClick={() => {
              setEmail("admin@demo.com");
              setPassword("admin123");
            }}
          >
            Admin demo
          </button>
        </div>
      </form>
    </div>
  );
}
