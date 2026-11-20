import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { HttpError, adminHistory, adminQueue, setMenuActive, transitionOrder } from "../services/orders.js";
import { customerCrm, dashboardStats } from "../services/stats.js";
import type { OrderStatus } from "../../../shared/types.js";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));

adminRouter.get("/queue", (_req, res) => {
  res.json({ orders: adminQueue() });
});

adminRouter.get("/history", (_req, res) => {
  res.json({ orders: adminHistory() });
});

adminRouter.patch("/orders/:id/status", (req, res) => {
  try {
    const status = req.body?.status as OrderStatus;
    const order = transitionOrder(req.params.id, status);
    res.json({ order });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Server error" });
  }
});

adminRouter.patch("/menu/:id", (req, res) => {
  try {
    if (typeof req.body?.active !== "boolean") {
      res.status(400).json({ error: "active must be a boolean" });
      return;
    }
    const item = setMenuActive(req.params.id, req.body.active);
    res.json({ item });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Server error" });
  }
});

adminRouter.get("/stats", (_req, res) => {
  res.json({ stats: dashboardStats() });
});

adminRouter.get("/customers", (_req, res) => {
  res.json({ customers: customerCrm() });
});
