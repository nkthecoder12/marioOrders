import { Router } from "express";
import { COOKIE, readSessionId, requireAuth } from "../middleware/auth.js";
import { createSession, destroySession, findUserByEmail, publicUser } from "../store.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  const user = findUserByEmail(email);
  // production: compare bcrypt hash with timing-safe equal
  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.password === "no-login") {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const session = createSession(user.id);
  res.cookie(COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  destroySession(readSessionId(req));
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
