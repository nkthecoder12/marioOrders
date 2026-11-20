import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { HttpError, createOrder, decorateOrder, getOrderForViewer, mockPay, ordersForUser } from "../services/orders.js";

export const ordersRouter = Router();

ordersRouter.post("/", requireAuth, (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const order = decorateOrder(createOrder(req.user!.id, req.user!.name, items));
    res.status(201).json({ order });
  } catch (err) {
    handle(err, res);
  }
});

ordersRouter.get("/mine", requireAuth, (req, res) => {
  res.json({ orders: ordersForUser(req.user!.id).map(decorateOrder) });
});

ordersRouter.get("/:id", requireAuth, (req, res) => {
  try {
    const order = decorateOrder(getOrderForViewer(req.params.id, req.user!.id, req.user!.role));
    res.json({ order });
  } catch (err) {
    handle(err, res);
  }
});

export const paymentsRouter = Router();

paymentsRouter.post("/mock-webhook", requireAuth, (req, res) => {
  try {
    const orderId = String(req.body?.orderId ?? "");
    const method = req.body?.method as "upi" | "card" | "cash";
    if (!["upi", "card", "cash"].includes(method)) {
      res.status(400).json({ error: "Choose a payment method" });
      return;
    }
    const existing = getOrderForViewer(orderId, req.user!.id, req.user!.role);
    if (req.user!.role !== "admin" && existing.userId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const order = mockPay(orderId, method);
    res.json({ order });
  } catch (err) {
    handle(err, res);
  }
});

function handle(err: unknown, res: import("express").Response): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
}
