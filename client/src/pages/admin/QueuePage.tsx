import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@shared/types";
import { EmptyState } from "../../components/EmptyState";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../lib/api";
import { formatInr } from "../../lib/money";
import { timeAgo } from "../../lib/time";

const COLS: { key: OrderStatus; title: string }[] = [
  { key: "PAID", title: "New" },
  { key: "PREPARING", title: "Preparing" },
  { key: "READY", title: "Ready" },
];

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PAID: { status: "PREPARING", label: "Start preparing" },
  PREPARING: { status: "READY", label: "Mark ready" },
  READY: { status: "COMPLETED", label: "Mark completed" },
};

export function QueuePage() {
  const { queue, history, flashingIds, reloadAdmin } = useData();
  const { push } = useToast();
  const [tab, setTab] = useState<OrderStatus | "COMPLETED">("PAID");
  const [now, setNow] = useState(Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Order[]> = { PAID: [], PREPARING: [], READY: [] };
    for (const o of queue) g[o.status]?.push(o);
    return g;
  }, [queue]);

  const completed = history.filter((o) => o.status === "COMPLETED");

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await api(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await reloadAdmin();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Could not update order");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(order: Order) {
    if (!window.confirm(`Cancel token #${order.tokenNumber}?`)) return;
    await setStatus(order.id, "CANCELLED");
  }

  const mobileList =
    tab === "COMPLETED" ? completed : grouped[tab] ?? [];

  return (
    <div className="px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <h1 className="text-2xl font-extrabold">Live queue</h1>
      <p className="text-sm text-stone-500">FIFO by payment time. New orders beep.</p>

      <div className="mt-4 grid grid-cols-4 gap-2 lg:hidden">
        {COLS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setTab(c.key)}
            className={`relative min-h-11 rounded-2xl text-xs font-bold ${
              tab === c.key ? "bg-orange-500 text-white" : "bg-white text-stone-600"
            }`}
          >
            {c.title}
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] text-white">
              {grouped[c.key]?.length ?? 0}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTab("COMPLETED")}
          className={`min-h-11 rounded-2xl text-xs font-bold ${
            tab === "COMPLETED" ? "bg-orange-500 text-white" : "bg-white text-stone-600"
          }`}
        >
          Done
        </button>
      </div>

      <div className="mt-4 space-y-3 lg:hidden">
        {!mobileList.length ? (
          <EmptyState title="No orders yet 🍹" />
        ) : (
          mobileList.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              now={now}
              busy={busyId === o.id}
              flash={flashingIds.has(o.id)}
              onAction={(s) => void setStatus(o.id, s)}
              onCancel={() => void cancel(o)}
            />
          ))
        )}
      </div>

      <div className="mt-6 hidden gap-4 lg:grid lg:grid-cols-3">
        {COLS.map((c) => (
          <section key={c.key}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{c.title}</h2>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                {grouped[c.key].length}
              </span>
            </div>
            <div className="space-y-3">
              {!grouped[c.key].length && (
                <p className="rounded-3xl bg-white/70 p-6 text-center text-sm text-stone-400">Empty</p>
              )}
              {grouped[c.key].map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  now={now}
                  busy={busyId === o.id}
                  flash={flashingIds.has(o.id)}
                  onAction={(s) => void setStatus(o.id, s)}
                  onCancel={() => void cancel(o)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  now,
  busy,
  flash,
  onAction,
  onCancel,
}: {
  order: Order;
  now: number;
  busy: boolean;
  flash: boolean;
  onAction: (status: OrderStatus) => void;
  onCancel: () => void;
}) {
  const next = NEXT[order.status];
  return (
    <article className={`rounded-3xl bg-white p-4 shadow-card ${flash ? "flash-new" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-black text-orange-500">#{order.tokenNumber}</p>
          <p className="font-semibold">{order.customerName}</p>
        </div>
        <p className="text-xs font-semibold text-stone-500">{timeAgo(order.paidAt, now)}</p>
      </div>
      <ul className="mt-2 text-sm text-stone-600">
        {order.items.map((i) => (
          <li key={i.itemId}>
            {i.qty}× {i.name}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-lg font-extrabold">{formatInr(order.totalPaise)}</p>
      {next && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(next.status)}
          className="mt-3 h-12 w-full rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Updating…" : next.label}
        </button>
      )}
      {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
        <button type="button" className="mt-2 h-11 w-full text-sm font-semibold text-red-600" onClick={onCancel}>
          Cancel
        </button>
      )}
    </article>
  );
}
