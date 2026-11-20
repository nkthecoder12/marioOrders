export type Role = "customer" | "admin";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PayMethod = "upi" | "card" | "cash";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
}

export interface MenuItem {
  id: string;
  name: string;
  pricePaise: number;
  category: string;
  emoji: string;
  active: boolean;
}

export interface OrderLine {
  itemId: string;
  name: string;
  unitPricePaise: number;
  qty: number;
}

export interface Order {
  id: string;
  tokenNumber: number | null;
  userId: string;
  customerName: string;
  items: OrderLine[];
  totalPaise: number;
  status: OrderStatus;
  paymentMethod: PayMethod | null;
  createdAt: string;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /** Computed at read/broadcast time — not stored as source of truth. */
  ordersAhead?: number;
}

export interface CustomerStats {
  userId: string;
  name: string;
  phone: string;
  visitCount: number;
  totalSpentPaise: number;
  favouriteItem: string | null;
  lastOrderAt: string | null;
}

export interface HourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface BestSeller {
  name: string;
  emoji: string;
  qty: number;
  revenuePaise: number;
}

export interface DashboardStats {
  revenuePaise: number;
  ordersCompleted: number;
  ordersInQueue: number;
  averageOrderValuePaise: number;
  paidCounted: number;
  bestSellers: BestSeller[];
  ordersPerHour: HourBucket[];
}

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const REVENUE_STATUSES: OrderStatus[] = [
  "PAID",
  "PREPARING",
  "READY",
  "COMPLETED",
];

export const QUEUE_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "READY"];
