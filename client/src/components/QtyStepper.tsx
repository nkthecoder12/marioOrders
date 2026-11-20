export function QtyStepper({
  qty,
  onAdd,
  onDec,
  disabled,
}: {
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  disabled?: boolean;
}) {
  if (qty <= 0) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-sm disabled:opacity-40"
        aria-label="Add to cart"
      >
        +
      </button>
    );
  }
  return (
    <div className="flex h-11 items-center rounded-2xl bg-orange-50 ring-1 ring-orange-200">
      <button type="button" onClick={onDec} className="h-11 w-11 text-lg font-bold text-orange-600" aria-label="Decrease">
        −
      </button>
      <span className="min-w-6 text-center text-sm font-bold">{qty}</span>
      <button type="button" onClick={onAdd} className="h-11 w-11 text-lg font-bold text-orange-600" aria-label="Increase">
        +
      </button>
    </div>
  );
}
