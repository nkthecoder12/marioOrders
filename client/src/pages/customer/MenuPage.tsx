import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QtyStepper } from "../../components/QtyStepper";
import { MenuSkeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useData } from "../../context/DataContext";
import { formatInr, itemCountLabel } from "../../lib/money";

const CATEGORIES = ["All", "Fresh Juices", "Shakes", "Specials"];

function statusLabel(status: string): string {
  if (status === "PAID") return "Paid";
  if (status === "PREPARING") return "Preparing";
  if (status === "READY") return "Ready";
  return status;
}

export function MenuPage() {
  const { user } = useAuth();
  const { menu, myOrders } = useData();
  const { qtyOf, add, dec, totalQty, lines } = useCart();
  const [cat, setCat] = useState("All");

  const visible = useMemo(
    () => menu.filter((m) => (cat === "All" ? true : m.category === cat)),
    [menu, cat],
  );

  const cartPaise = useMemo(() => {
    return lines.reduce((sum, l) => {
      const item = menu.find((m) => m.id === l.itemId);
      return sum + (item ? item.pricePaise * l.qty : 0);
    }, 0);
  }, [lines, menu]);

  const liveActive = myOrders.find(
    (o) =>
      o.status === "PENDING_PAYMENT" ||
      o.status === "PAID" ||
      o.status === "PREPARING" ||
      o.status === "READY",
  );

  if (!menu.length) return <MenuSkeleton />;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-juice-cream/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Mario Juice</p>
        <h1 className="text-2xl font-extrabold">Hey {user?.name} 👋</h1>
        <p className="text-sm text-stone-500">Fresh squeezed, made to order.</p>
        {liveActive && (
          <Link
            to={liveActive.status === "PENDING_PAYMENT" ? `/pay/${liveActive.id}` : `/orders/${liveActive.id}`}
            className="mt-3 flex min-h-11 items-center justify-between rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-card"
          >
            <span>
              {liveActive.status === "PENDING_PAYMENT"
                ? "Finish payment"
                : `Active order #${liveActive.tokenNumber} · ${statusLabel(liveActive.status)}`}
            </span>
            <span>→</span>
          </Link>
        )}
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
                cat === c ? "bg-orange-500 text-white" : "bg-white text-stone-600 ring-1 ring-orange-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <ul className="space-y-3 p-4">
        {visible.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 rounded-3xl bg-white p-3 shadow-card ${!item.active ? "opacity-70" : ""}`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-4xl">{item.emoji}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{item.name}</p>
              <p className="text-lg font-extrabold text-orange-600">{formatInr(item.pricePaise)}</p>
              {!item.active && <p className="text-xs font-semibold text-stone-500">Sold out</p>}
            </div>
            {item.active ? (
              <QtyStepper qty={qtyOf(item.id)} onAdd={() => add(item.id)} onDec={() => dec(item.id)} />
            ) : (
              <button type="button" disabled className="h-11 rounded-2xl bg-stone-200 px-3 text-xs font-bold text-stone-500">
                Sold out
              </button>
            )}
          </li>
        ))}
      </ul>

      {totalQty > 0 && (
        <div className="pointer-events-none fixed bottom-20 left-0 right-0 z-30 px-4 slide-up">
          <Link
            to="/cart"
            className="pointer-events-auto mx-auto flex min-h-14 max-w-lg items-center justify-between rounded-2xl bg-stone-900 px-5 text-white shadow-bar"
          >
            <span className="font-semibold">
              {itemCountLabel(totalQty)} · {formatInr(cartPaise)}
            </span>
            <span className="font-bold">View cart</span>
          </Link>
        </div>
      )}
    </div>
  );
}
