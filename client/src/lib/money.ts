export function formatInr(paise: number): string {
  return `₹${Math.round(paise / 100)}`;
}

export function itemCountLabel(n: number): string {
  return n === 1 ? "1 item" : `${n} items`;
}
