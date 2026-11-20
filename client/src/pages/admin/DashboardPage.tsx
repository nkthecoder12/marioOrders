import { StatusBadge } from "../../components/StatusBadge";
import { useData } from "../../context/DataContext";
import { formatInr } from "../../lib/money";
import { formatClock } from "../../lib/time";

export function DashboardPage() {
  const { stats, customers, history } = useData();
  const maxBar = Math.max(1, ...stats.ordersPerHour.map((h) => h.count));

  return (
    <div className="px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <h1 className="text-2xl font-extrabold">Today</h1>
      <p className="text-sm text-stone-500">Resets when the demo server restarts.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={formatInr(stats.revenuePaise)} />
        <Stat label="Completed" value={String(stats.ordersCompleted)} />
        <Stat label="In queue" value={String(stats.ordersInQueue)} />
        <Stat label="Avg order" value={formatInr(stats.averageOrderValuePaise)} />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-bold">Orders per hour</h2>
        <div className="mt-3 flex h-40 items-end gap-1 overflow-x-auto">
          {stats.ordersPerHour.map((b) => (
            <div key={b.hour} className="flex min-w-[1.6rem] flex-1 flex-col items-center justify-end">
              <div
                className="w-full max-w-8 rounded-t-lg bg-orange-400"
                style={{ height: `${(b.count / maxBar) * 100}%`, minHeight: b.count ? 6 : 2 }}
                title={`${b.count}`}
              />
              <span className="mt-1 text-[10px] font-semibold text-stone-500">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-bold">Top sellers</h2>
        <ol className="mt-2 space-y-2">
          {stats.bestSellers.map((s, i) => (
            <li key={s.name} className="flex items-center gap-3">
              <span className="w-5 text-sm font-bold text-stone-400">{i + 1}</span>
              <span className="text-xl">{s.emoji}</span>
              <span className="flex-1 font-semibold">{s.name}</span>
              <span className="text-sm text-stone-500">{s.qty} sold</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-bold">Customers</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr>
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Phone</th>
                <th className="pb-2 font-semibold">Visits</th>
                <th className="pb-2 font-semibold">Spent</th>
                <th className="pb-2 font-semibold">Favourite</th>
                <th className="pb-2 font-semibold">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.userId} className="border-t border-orange-50">
                  <td className="py-2 font-semibold">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.visitCount}</td>
                  <td>{formatInr(c.totalSpentPaise)}</td>
                  <td>{c.favouriteItem ?? "—"}</td>
                  <td>{formatClock(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-bold">Completed history</h2>
        <ul className="mt-2 space-y-2">
          {history
            .filter((o) => o.status === "COMPLETED")
            .map((o) => (
              <li key={o.id} className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold">#{o.tokenNumber} · {o.customerName}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-sm text-stone-500">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                <p className="mt-1 text-sm font-semibold text-orange-600">{formatInr(o.totalPaise)}</p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
