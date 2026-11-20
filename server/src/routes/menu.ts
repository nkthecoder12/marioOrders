import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listMenu } from "../store.js";

export const menuRouter = Router();

menuRouter.get("/", requireAuth, (_req, res) => {
  res.json({ menu: listMenu() });
});
