import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../lib/api";
import { formatInr } from "../../lib/money";

export function MenuAdminPage() {
  const { menu, reloadMenu } = useData();
  const { push } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, active: boolean) {
    setBusy(id);
    try {
      await api(`/api/admin/menu/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      await reloadMenu();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Could not update item");
    } finally {
      setBusy(null);
    }
  }

  const cats = [...new Set(menu.map((m) => m.category))];

  return (
    <div className="px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <h1 className="text-2xl font-extrabold">Menu</h1>
      <p className="text-sm text-stone-500">Toggle availability. Customers see it instantly.</p>
      {cats.map((cat) => (
        <section key={cat} className="mt-5">
          <h2 className="mb-2 font-bold text-stone-600">{cat}</h2>
          <ul className="space-y-2">
            {menu
              .filter((m) => m.category === cat)
              .map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm font-semibold text-orange-600">{formatInr(item.pricePaise)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => void toggle(item.id, !item.active)}
                    className={`relative h-8 w-14 rounded-full transition ${item.active ? "bg-lime-500" : "bg-stone-300"}`}
                    aria-pressed={item.active}
                    aria-label={`Toggle ${item.name}`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                        item.active ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
