import type {
  BestSeller,
  CustomerStats,
  DashboardStats,
  HourBucket,
} from "../../../shared/types.js";
import { REVENUE_STATUSES } from "../../../shared/types.js";
import { store } from "../store.js";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dashboardStats(): DashboardStats {
  const today = startOfToday().getTime();
  const counted = [...store.orders.values()].filter((o) => {
    if (!REVENUE_STATUSES.includes(o.status) || !o.paidAt) return false;
    return new Date(o.paidAt).getTime() >= today;
  });

  const revenuePaise = counted.reduce((s, o) => s + o.totalPaise, 0);
  const ordersCompleted = counted.filter((o) => o.status === "COMPLETED").length;
  const ordersInQueue = counted.filter(
    (o) => o.status === "PAID" || o.status === "PREPARING" || o.status === "READY",
  ).length;
  const averageOrderValuePaise = counted.length ? Math.round(revenuePaise / counted.length) : 0;

  const byName = new Map<string, BestSeller>();
  for (const order of counted) {
    for (const line of order.items) {
      const menu = store.menu.get(line.itemId);
      const current = byName.get(line.name) ?? {
        name: line.name,
        emoji: menu?.emoji ?? "🥤",
        qty: 0,
        revenuePaise: 0,
      };
      current.qty += line.qty;
      current.revenuePaise += line.unitPricePaise * line.qty;
      byName.set(line.name, current);
    }
  }

  const bestSellers = [...byName.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const hours = new Map<number, number>();
  for (let h = 8; h <= 22; h++) hours.set(h, 0);
  for (const order of counted) {
    const hour = new Date(order.paidAt!).getHours();
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  }

  const ordersPerHour: HourBucket[] = [...hours.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({
      hour,
      label: `${hour % 12 || 12}${hour < 12 ? "a" : "p"}`,
      count,
    }));

  return {
    revenuePaise,
    ordersCompleted,
    ordersInQueue,
    averageOrderValuePaise,
    paidCounted: counted.length,
    bestSellers,
    ordersPerHour,
  };
}

export function customerCrm(): CustomerStats[] {
  const today = startOfToday().getTime();
  const byUser = new Map<string, CustomerStats>();

  for (const user of store.users.values()) {
    if (user.role !== "customer") continue;
    byUser.set(user.id, {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      visitCount: 0,
      totalSpentPaise: 0,
      favouriteItem: null,
      lastOrderAt: null,
    });
  }

  for (const order of store.orders.values()) {
    if (!REVENUE_STATUSES.includes(order.status) || !order.paidAt) continue;
    if (new Date(order.paidAt).getTime() < today) continue;
    const row = byUser.get(order.userId);
    if (!row) continue;
    row.visitCount += 1;
    row.totalSpentPaise += order.totalPaise;
    if (!row.lastOrderAt || order.paidAt > row.lastOrderAt) {
      row.lastOrderAt = order.paidAt;
    }
  }

  for (const [userId, row] of byUser) {
    const qtyByName = new Map<string, number>();
    for (const order of store.orders.values()) {
      if (order.userId !== userId || !REVENUE_STATUSES.includes(order.status)) continue;
      for (const line of order.items) {
        qtyByName.set(line.name, (qtyByName.get(line.name) ?? 0) + line.qty);
      }
    }
    let best: string | null = null;
    let bestQty = 0;
    for (const [name, qty] of qtyByName) {
      if (qty > bestQty) {
        best = name;
        bestQty = qty;
      }
    }
    row.favouriteItem = best;
  }

  return [...byUser.values()].sort((a, b) => b.totalSpentPaise - a.totalSpentPaise);
}
