import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import type { OrderStatus } from "@shared/types";
import { useData } from "../../context/DataContext";
import { formatInr } from "../../lib/money";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PAID", label: "Paid" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "COMPLETED", label: "Collected" },
];

function stepIndex(status: OrderStatus): number {
  if (status === "PENDING_PAYMENT") return -1;
  if (status === "CANCELLED") return -1;
  const i = STEPS.findIndex((s) => s.key === status);
  return i;
}

export function OrderStatusPage() {
  const { id } = useParams();
  const { myOrders, reloadMine } = useData();
  const order = myOrders.find((o) => o.id === id);
  const vibrated = useRef<string | null>(null);

  useEffect(() => {
    void reloadMine();
  }, [reloadMine]);

  useEffect(() => {
    if (order?.status === "READY" && vibrated.current !== order.id) {
      vibrated.current = order.id;
      try {
        navigator.vibrate?.(400);
      } catch {
        /* ignore */
      }
    }
  }, [order]);

  const ahead = useMemo(() => order?.ordersAhead ?? 0, [order]);

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-sm text-stone-500">Loading order…</p>
        <Link to="/orders" className="mt-3 inline-block font-semibold text-orange-600">
          My orders
        </Link>
      </div>
    );
  }

  const idx = stepIndex(order.status);
  const ready = order.status === "READY";

  return (
    <div className="px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link to="/orders" className="text-sm font-semibold text-orange-600">
        ← My orders
      </Link>
      {order.status === "CANCELLED" && (
        <div className="mt-6 rounded-3xl bg-red-50 p-6 text-center">
          <p className="text-lg font-bold text-red-700">This order was cancelled</p>
        </div>
      )}
      {order.status === "PENDING_PAYMENT" && (
        <Link to={`/pay/${order.id}`} className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">
          Complete payment
        </Link>
      )}

      {order.tokenNumber && (
        <div className={`mt-6 rounded-3xl bg-white p-6 text-center shadow-card ${ready ? "pop-in ring-2 ring-lime-400" : ""}`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Token</p>
          <p className="text-7xl font-black text-orange-500">#{order.tokenNumber}</p>
          {ready ? (
            <p className="mt-3 text-xl font-extrabold text-lime-700">Your juice is ready! 🎉</p>
          ) : order.status === "COMPLETED" ? (
            <p className="mt-3 font-semibold text-stone-600">Collected. Enjoy!</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-stone-600">
                {ahead === 0 ? "You're next" : `${ahead} order${ahead === 1 ? "" : "s"} ahead of you`}
              </p>
              <p className="text-lg font-bold">Est. wait {ahead * 3} min</p>
            </>
          )}
        </div>
      )}

      <ol className="mt-6 flex items-start justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = idx >= i;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done ? "bg-orange-500 text-white" : "bg-white text-stone-400 ring-1 ring-orange-100"
                }`}
              >
                {i + 1}
              </div>
              <span className={`mt-1 text-[11px] font-semibold ${done ? "text-orange-700" : "text-stone-400"}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="relative -mt-12 mb-8 h-1 px-8">
        <div className="h-1 rounded-full bg-orange-100">
          <div
            className="h-1 rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${Math.max(idx, 0) * (100 / 3)}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card">
        {order.items.map((i) => (
          <div key={i.itemId} className="flex justify-between py-1 text-sm">
            <span>
              {i.qty}× {i.name}
            </span>
            <span className="font-semibold">{formatInr(i.unitPricePaise * i.qty)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-orange-100 pt-2 font-bold">
          <span>Total</span>
          <span className="text-orange-600">{formatInr(order.totalPaise)}</span>
        </div>
      </div>
    </div>
  );
}
