import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../../shared/types.js";
import { getSessionUser } from "../store.js";

declare global {
  namespace Express {
    interface Request {
      user?: import("../../../shared/types.js").PublicUser;
    }
  }
}

const COOKIE = "sid";

export function readSessionId(req: Request): string | undefined {
  return req.cookies?.[COOKIE] as string | undefined;
}

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const user = getSessionUser(readSessionId(req));
  if (user) req.user = user;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export { COOKIE };
