import type { OrderStatus } from "@shared/types";

const styles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-lime-100 text-lime-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const labels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting pay",
  PAID: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Collected",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>
  );
}
