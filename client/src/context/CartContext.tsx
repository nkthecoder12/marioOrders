import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  itemId: string;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  qtyOf: (itemId: string) => number;
  add: (itemId: string) => void;
  dec: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  totalQty: number;
}

const KEY = "mario-cart";
const Ctx = createContext<CartCtx | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const qtyOf = useCallback((itemId: string) => lines.find((l) => l.itemId === itemId)?.qty ?? 0, [lines]);

  const add = useCallback((itemId: string) => {
    setLines((prev) => {
      const found = prev.find((l) => l.itemId === itemId);
      if (found) return prev.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { itemId, qty: 1 }];
    });
  }, []);

  const dec = useCallback((itemId: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const setQty = useCallback((itemId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.itemId !== itemId);
      if (prev.some((l) => l.itemId === itemId)) {
        return prev.map((l) => (l.itemId === itemId ? { ...l, qty } : l));
      }
      return [...prev, { itemId, qty }];
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totalQty = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const value = useMemo(
    () => ({ lines, qtyOf, add, dec, setQty, remove, clear, totalQty }),
    [lines, qtyOf, add, dec, setQty, remove, clear, totalQty],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
}
