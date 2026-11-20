import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { useData } from "../../context/DataContext";
import { formatInr } from "../../lib/money";
import { formatClock } from "../../lib/time";

export function MyOrdersPage() {
  const { myOrders } = useData();

  return (
    <div>
      <header className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-extrabold">My orders</h1>
      </header>
      {!myOrders.length ? (
        <EmptyState title="No orders yet 🍹" hint="Your glasses will show up here." />
      ) : (
        <ul className="space-y-3 p-4">
          {myOrders.map((o) => (
            <li key={o.id}>
              <Link to={o.status === "PENDING_PAYMENT" ? `/pay/${o.id}` : `/orders/${o.id}`} className="block rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold">{o.tokenNumber ? `#${o.tokenNumber}` : "Unpaid"}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                </p>
                <div className="mt-2 flex justify-between text-sm font-semibold">
                  <span>{formatClock(o.createdAt)}</span>
                  <span className="text-orange-600">{formatInr(o.totalPaise)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
