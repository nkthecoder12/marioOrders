import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CustomerStats,
  DashboardStats,
  MenuItem,
  Order,
} from "@shared/types";
import { api } from "../lib/api";
import { playBeep, unlockAudio } from "../lib/beep";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface DataCtx {
  menu: MenuItem[];
  myOrders: Order[];
  queue: Order[];
  history: Order[];
  stats: DashboardStats;
  customers: CustomerStats[];
  sseEpoch: number;
  flashingIds: Set<string>;
  reloadAll: () => Promise<void>;
  reloadMenu: () => Promise<void>;
  reloadMine: () => Promise<void>;
  reloadAdmin: () => Promise<void>;
}

const emptyStats: DashboardStats = {
  revenuePaise: 0,
  ordersCompleted: 0,
  ordersInQueue: 0,
  averageOrderValuePaise: 0,
  paidCounted: 0,
  bestSellers: [],
  ordersPerHour: [],
};

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [queue, setQueue] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [sseEpoch, setSseEpoch] = useState(0);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const knownQueue = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const reloadMenu = useCallback(async () => {
    const data = await api<{ menu: MenuItem[] }>("/api/menu");
    setMenu(data.menu);
  }, []);

  const reloadMine = useCallback(async () => {
    const data = await api<{ orders: Order[] }>("/api/orders/mine");
    setMyOrders(data.orders);
  }, []);

  const reloadAdmin = useCallback(async () => {
    const [q, h, s, c] = await Promise.all([
      api<{ orders: Order[] }>("/api/admin/queue"),
      api<{ orders: Order[] }>("/api/admin/history"),
      api<{ stats: DashboardStats }>("/api/admin/stats"),
      api<{ customers: CustomerStats[] }>("/api/admin/customers"),
    ]);
    setQueue(q.orders);
    setHistory(h.orders);
    setStats(s.stats);
    setCustomers(c.customers);
    if (!primed.current) {
      knownQueue.current = new Set(q.orders.map((o) => o.id));
      primed.current = true;
    }
  }, []);

  const reloadAll = useCallback(async () => {
    if (!user) return;
    try {
      await reloadMenu();
      if (user.role === "customer") await reloadMine();
      if (user.role === "admin") await reloadAdmin();
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not refresh");
    }
  }, [user, reloadMenu, reloadMine, reloadAdmin, push]);

  useEffect(() => {
    primed.current = false;
    knownQueue.current = new Set();
    void reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (!user) return;
    const es = new EventSource("/api/events");
    es.onopen = () => setSseEpoch((n) => n + 1);
    es.addEventListener("menu-updated", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { menu: MenuItem[] };
      setMenu(data.menu);
    });
    es.addEventListener("order-updated", (ev) => {
      const { order } = JSON.parse((ev as MessageEvent).data) as { order: Order };
      setMyOrders((prev) => {
        const i = prev.findIndex((o) => o.id === order.id);
        if (i === -1) return [order, ...prev];
        const next = [...prev];
        next[i] = order;
        return next;
      });
      setQueue((prev) => {
        const active = order.status === "PAID" || order.status === "PREPARING" || order.status === "READY";
        const without = prev.filter((o) => o.id !== order.id);
        if (!active) return without;
        return [...without, order].sort((a, b) => (a.paidAt ?? "").localeCompare(b.paidAt ?? ""));
      });
      if (user.role === "admin") {
        void reloadAdmin();
      } else {
        void reloadMine();
      }
    });
    es.addEventListener("order-created", (ev) => {
      const { order } = JSON.parse((ev as MessageEvent).data) as { order: Order };
      if (user.role === "admin") {
        if (primed.current && !knownQueue.current.has(order.id)) {
          playBeep();
          setFlashingIds((s) => new Set(s).add(order.id));
          window.setTimeout(() => {
            setFlashingIds((s) => {
              const n = new Set(s);
              n.delete(order.id);
              return n;
            });
          }, 1600);
        }
        knownQueue.current.add(order.id);
      }
      setQueue((prev) => {
        if (prev.some((o) => o.id === order.id)) {
          return prev.map((o) => (o.id === order.id ? order : o));
        }
        return [...prev, order].sort((a, b) => (a.paidAt ?? "").localeCompare(b.paidAt ?? ""));
      });
      if (user.role === "admin") void reloadAdmin();
    });
    return () => es.close();
  }, [user, reloadAdmin, reloadMine]);

  useEffect(() => {
    if (sseEpoch <= 1) return;
    void reloadAll();
  }, [sseEpoch, reloadAll]);

  useEffect(() => {
    const onFirst = () => unlockAudio();
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);

  const value = useMemo(
    () => ({
      menu,
      myOrders,
      queue,
      history,
      stats,
      customers,
      sseEpoch,
      flashingIds,
      reloadAll,
      reloadMenu,
      reloadMine,
      reloadAdmin,
    }),
    [menu, myOrders, queue, history, stats, customers, sseEpoch, flashingIds, reloadAll, reloadMenu, reloadMine, reloadAdmin],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("DataProvider missing");
  return ctx;
}
