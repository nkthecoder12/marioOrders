import type { Response } from "express";
import type { MenuItem, Order, Role } from "../../../shared/types.js";
import { store } from "../store.js";

interface Client {
  id: number;
  res: Response;
  userId: string;
  role: Role;
}

let nextClientId = 1;
const clients = new Set<Client>();

export function addSseClient(res: Response, userId: string, role: Role): Client {
  const client: Client = { id: nextClientId++, res, userId, role };
  clients.add(client);
  return client;
}

export function removeSseClient(client: Client): void {
  clients.delete(client);
}

function write(client: Client, event: string, data: unknown): void {
  client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function heartbeatAll(): void {
  for (const client of clients) {
    client.res.write(": heartbeat\n\n");
  }
}

function queueAhead(order: Order): number {
  if (!order.paidAt) return 0;
  return [...store.orders.values()].filter(
    (o) =>
      (o.status === "PAID" || o.status === "PREPARING") &&
      o.id !== order.id &&
      !!o.paidAt &&
      !!order.paidAt &&
      o.paidAt < order.paidAt,
  ).length;
}

function notifyQueuePositions(): void {
  for (const order of store.orders.values()) {
    if (order.status !== "PAID" && order.status !== "PREPARING" && order.status !== "READY") continue;
    const decorated = { ...order, ordersAhead: queueAhead(order) };
    for (const client of clients) {
      if (client.userId === order.userId) {
        write(client, "order-updated", { order: decorated });
      }
    }
  }
}

export function broadcastOrderCreated(order: Order): void {
  for (const client of clients) {
    if (client.role === "admin") {
      write(client, "order-created", { order });
    } else if (client.userId === order.userId) {
      write(client, "order-updated", { order });
    }
  }
  notifyQueuePositions();
}

export function broadcastOrderUpdated(order: Order): void {
  for (const client of clients) {
    if (client.role === "admin" || client.userId === order.userId) {
      write(client, "order-updated", { order });
    }
  }
  notifyQueuePositions();
}

export function broadcastMenuUpdated(menu: MenuItem[]): void {
  for (const client of clients) {
    write(client, "menu-updated", { menu });
  }
}

setInterval(heartbeatAll, 25_000).unref();
