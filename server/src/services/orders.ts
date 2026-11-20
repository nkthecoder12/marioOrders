import { randomUUID } from "node:crypto";
import type { Order, OrderStatus, PayMethod } from "../../../shared/types.js";
import { VALID_TRANSITIONS } from "../../../shared/types.js";
import { listMenu, nextTokenNumber, store } from "../store.js";
import { broadcastMenuUpdated, broadcastOrderCreated, broadcastOrderUpdated } from "./sse.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function createOrder(
  userId: string,
  customerName: string,
  items: { itemId: string; qty: number }[],
): Order {
  if (!items.length) throw new HttpError(400, "Cart is empty");

  const merged = new Map<string, number>();
  for (const line of items) {
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      throw new HttpError(400, "Each item needs a quantity of at least 1");
    }
    merged.set(line.itemId, (merged.get(line.itemId) ?? 0) + line.qty);
  }

  const snapshot = [];
  for (const [itemId, qty] of merged) {
    const menuItem = store.menu.get(itemId);
    if (!menuItem) throw new HttpError(400, "Unknown menu item");
    if (!menuItem.active) {
      throw new HttpError(400, `${menuItem.name} is sold out. Remove it from your cart to continue.`);
    }
    snapshot.push({
      itemId,
      name: menuItem.name,
      unitPricePaise: menuItem.pricePaise, // never trust client prices
      qty,
    });
  }

  const totalPaise = snapshot.reduce((sum, line) => sum + line.unitPricePaise * line.qty, 0);
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    tokenNumber: null,
    userId,
    customerName,
    items: snapshot,
    totalPaise,
    status: "PENDING_PAYMENT",
    paymentMethod: null,
    createdAt: now,
    paidAt: null,
    preparingAt: null,
    readyAt: null,
    completedAt: null,
    cancelledAt: null,
  };

  store.orders.set(order.id, order);
  return order;
}

export function mockPay(orderId: string, method: PayMethod): Order {
  const order = store.orders.get(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  // Idempotent: a second webhook for an already-paid order returns the same token.
  // production: verify gateway signature here
  if (order.status !== "PENDING_PAYMENT") {
    if (order.status === "CANCELLED") {
      throw new HttpError(400, "This order was cancelled");
    }
    return decorateOrder(order);
  }

  // production: use Postgres transaction
  order.status = "PAID";
  order.paymentMethod = method;
  order.paidAt = new Date().toISOString();
  order.tokenNumber = nextTokenNumber();
  store.orders.set(order.id, order);
  broadcastOrderCreated(decorateOrder(order));
  return decorateOrder(order);
}

export function transitionOrder(orderId: string, next: OrderStatus): Order {
  const order = store.orders.get(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(next)) {
    throw new HttpError(400, `Cannot move from ${order.status} to ${next}`);
  }

  const now = new Date().toISOString();
  order.status = next;
  if (next === "PREPARING") order.preparingAt = now;
  if (next === "READY") order.readyAt = now;
  if (next === "COMPLETED") order.completedAt = now;
  if (next === "CANCELLED") order.cancelledAt = now;

  store.orders.set(order.id, order);
  broadcastOrderUpdated(decorateOrder(order));
  return decorateOrder(order);
}

export function setMenuActive(itemId: string, active: boolean) {
  const item = store.menu.get(itemId);
  if (!item) throw new HttpError(404, "Menu item not found");
  item.active = active;
  store.menu.set(item.id, item);
  broadcastMenuUpdated(listMenu());
  return item;
}

export function getOrderForViewer(orderId: string, userId: string, role: string): Order {
  const order = store.orders.get(orderId);
  if (!order) throw new HttpError(404, "Order not found");
  if (role !== "admin" && order.userId !== userId) {
    throw new HttpError(403, "You cannot view this order");
  }
  return order;
}

export function ordersForUser(userId: string): Order[] {
  return [...store.orders.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function adminQueue(): Order[] {
  return [...store.orders.values()]
    .filter((o) => o.status === "PAID" || o.status === "PREPARING" || o.status === "READY")
    .sort((a, b) => (a.paidAt ?? "").localeCompare(b.paidAt ?? ""));
}

export function adminHistory(): Order[] {
  return [...store.orders.values()]
    .filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED")
    .sort((a, b) => (b.completedAt ?? b.cancelledAt ?? "").localeCompare(a.completedAt ?? a.cancelledAt ?? ""));
}

export function ordersAheadOf(order: Order): number {
  if (!order.paidAt) return 0;
  return adminQueue().filter(
    (o) =>
      (o.status === "PAID" || o.status === "PREPARING") &&
      o.id !== order.id &&
      !!o.paidAt &&
      o.paidAt < order.paidAt!,
  ).length;
}

export function decorateOrder(order: Order): Order {
  return { ...order, ordersAhead: ordersAheadOf(order) };
}
