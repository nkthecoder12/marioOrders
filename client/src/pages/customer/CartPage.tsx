import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { QtyStepper } from "../../components/QtyStepper";
import { useCart } from "../../context/CartContext";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../lib/api";
import { formatInr } from "../../lib/money";
import type { Order } from "@shared/types";

export function CartPage() {
  const { menu } = useData();
  const { lines, add, dec, remove, clear, totalQty } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () =>
      lines.map((l) => {
        const item = menu.find((m) => m.id === l.itemId);
        return { ...l, item };
      }),
    [lines, menu],
  );

  const total = rows.reduce((s, r) => s + (r.item ? r.item.pricePaise * r.qty : 0), 0);

  async function checkout() {
    setBusy(true);
    try {
      const soldOut = rows.filter((r) => r.item && !r.item.active);
      if (soldOut.length) {
        throw new Error(
          `${soldOut.map((s) => s.item!.name).join(", ")} ${soldOut.length === 1 ? "is" : "are"} sold out. Remove to continue.`,
        );
      }
      const data = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })) }),
      });
      clear();
      navigate(`/pay/${data.order.id}`);
    } catch (err) {
      push(err instanceof ApiError || err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!totalQty) {
    return (
      <div>
        <Header />
        <EmptyState title="No orders yet 🍹" hint="Add a juice from the menu." />
        <div className="px-4">
          <Link to="/menu" className="flex h-12 items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <ul className="space-y-3 p-4">
        {rows.map((row) => (
          <li key={row.itemId} className="rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{row.item?.emoji ?? "🥤"}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{row.item?.name ?? "Removed item"}</p>
                <p className="text-sm font-semibold text-orange-600">
                  {row.item ? formatInr(row.item.pricePaise * row.qty) : "—"}
                </p>
                {row.item && !row.item.active && (
                  <p className="mt-1 text-xs font-semibold text-red-600">Sold out — remove before paying</p>
                )}
              </div>
              <button type="button" className="text-xs font-semibold text-stone-400" onClick={() => remove(row.itemId)}>
                Remove
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <QtyStepper qty={row.qty} onAdd={() => add(row.itemId)} onDec={() => dec(row.itemId)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-card">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-extrabold text-orange-600">{formatInr(total)}</span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void checkout()}
          className="mt-4 h-14 w-full rounded-2xl bg-orange-500 text-lg font-bold text-white disabled:opacity-50"
        >
          {busy ? "Creating order…" : "Proceed to pay"}
        </button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link to="/menu" className="text-sm font-semibold text-orange-600">
        ← Menu
      </Link>
      <h1 className="text-2xl font-extrabold">Your cart</h1>
    </header>
  );
}
