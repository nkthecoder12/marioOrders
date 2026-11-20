import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Order, PayMethod } from "@shared/types";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../lib/api";
import { formatInr } from "../../lib/money";

const METHODS: { id: PayMethod; label: string; hint: string }[] = [
  { id: "upi", label: "UPI", hint: "GPay / PhonePe / Paytm" },
  { id: "card", label: "Card", hint: "Visa, Mastercard, RuPay" },
  { id: "cash", label: "Cash at counter", hint: "Pay when you collect" },
];

export function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { reloadMine } = useData();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<PayMethod>("upi");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api<{ order: Order }>(`/api/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        if (d.order.status !== "PENDING_PAYMENT") {
          navigate(`/orders/${d.order.id}`, { replace: true });
        }
      })
      .catch((err: unknown) => push(err instanceof Error ? err.message : "Order missing"));
  }, [id, navigate, push]);

  async function pay() {
    if (!order) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const data = await api<{ order: Order }>("/api/payments/mock-webhook", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, method }),
      });
      await reloadMine();
      navigate(`/orders/${data.order.id}`, { replace: true });
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  if (!order) {
    return <div className="p-6 text-sm text-stone-500">Loading payment…</div>;
  }

  return (
    <div className="px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link to="/cart" className="text-sm font-semibold text-orange-600">
        ← Cart
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Pay {formatInr(order.totalPaise)}</h1>
      <p className="text-sm text-stone-500">Mock checkout — no real money moves.</p>

      <div className="mt-4 space-y-2">
        {METHODS.map((m) => (
          <label
            key={m.id}
            className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-3xl bg-white px-4 shadow-card ring-2 ${
              method === m.id ? "ring-orange-500" : "ring-transparent"
            }`}
          >
            <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} />
            <div>
              <p className="font-bold">{m.label}</p>
              <p className="text-xs text-stone-500">{m.hint}</p>
            </div>
          </label>
        ))}
      </div>

      <ul className="mt-5 rounded-3xl bg-white p-4 text-sm shadow-card">
        {order.items.map((i) => (
          <li key={i.itemId} className="flex justify-between py-1">
            <span>
              {i.qty}× {i.name}
            </span>
            <span className="font-semibold">{formatInr(i.unitPricePaise * i.qty)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={busy}
        onClick={() => void pay()}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white disabled:opacity-70"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing…
          </span>
        ) : (
          `Pay ${formatInr(order.totalPaise)}`
        )}
      </button>
    </div>
  );
}
