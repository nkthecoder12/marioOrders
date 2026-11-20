import type { Order, OrderLine } from "../../shared/types.js";
import { addUser, store } from "./store.js";

function todayAt(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function iso(d: Date): string {
  return d.toISOString();
}

export function seed(): void {
  store.users.clear();
  store.usersByEmail.clear();
  store.sessions.clear();
  store.menu.clear();
  store.orders.clear();
  store.nextToken = 0;

  const ravi = addUser({
    email: "user@demo.com",
    password: "user123",
    name: "Ravi",
    phone: "9876543210",
    role: "customer",
  });

  addUser({
    email: "admin@demo.com",
    password: "admin123",
    name: "Mario",
    phone: "9000000001",
    role: "admin",
  });

  const priya = addUser({
    email: "priya@internal.demo",
    password: "no-login",
    name: "Priya",
    phone: "9123456780",
    role: "customer",
  });

  const arjun = addUser({
    email: "arjun@internal.demo",
    password: "no-login",
    name: "Arjun",
    phone: "9988776655",
    role: "customer",
  });

  const menuSeed = [
    { id: "orange", name: "Orange", pricePaise: 6000, category: "Fresh Juices", emoji: "🍊", active: true },
    { id: "watermelon", name: "Watermelon", pricePaise: 5000, category: "Fresh Juices", emoji: "🍉", active: true },
    { id: "mango", name: "Mango", pricePaise: 8000, category: "Fresh Juices", emoji: "🥭", active: true },
    { id: "pineapple", name: "Pineapple", pricePaise: 7000, category: "Fresh Juices", emoji: "🍍", active: true },
    { id: "pomegranate", name: "Pomegranate", pricePaise: 9000, category: "Fresh Juices", emoji: "🍎", active: true },
    { id: "mosambi", name: "Mosambi", pricePaise: 6000, category: "Fresh Juices", emoji: "🍋", active: true },
    { id: "banana-shake", name: "Banana Shake", pricePaise: 7000, category: "Shakes", emoji: "🍌", active: true },
    { id: "chocolate-shake", name: "Chocolate Shake", pricePaise: 9000, category: "Shakes", emoji: "🍫", active: true },
    { id: "cold-coffee", name: "Cold Coffee", pricePaise: 8000, category: "Shakes", emoji: "☕", active: true },
    { id: "mixed-fruit", name: "Mixed Fruit Bowl", pricePaise: 10000, category: "Specials", emoji: "🥗", active: true },
    { id: "lemon-mint", name: "Lemon Mint Cooler", pricePaise: 4000, category: "Specials", emoji: "🍃", active: true },
  ];

  for (const item of menuSeed) {
    store.menu.set(item.id, item);
  }

  const line = (itemId: string, qty: number): OrderLine => {
    const item = store.menu.get(itemId)!;
    return { itemId, name: item.name, unitPricePaise: item.pricePaise, qty };
  };

  const completed = (
    id: string,
    user: { id: string; name: string },
    items: OrderLine[],
    hour: number,
    minute: number,
    method: "upi" | "card" | "cash",
  ): Order => {
    const paid = todayAt(hour, minute);
    const preparing = new Date(paid.getTime() + 2 * 60 * 1000);
    const ready = new Date(paid.getTime() + 6 * 60 * 1000);
    const completedAt = new Date(paid.getTime() + 9 * 60 * 1000);
    const totalPaise = items.reduce((s, i) => s + i.unitPricePaise * i.qty, 0);
    store.nextToken += 1;
    return {
      id,
      tokenNumber: store.nextToken,
      userId: user.id,
      customerName: user.name,
      items,
      totalPaise,
      status: "COMPLETED",
      paymentMethod: method,
      createdAt: iso(new Date(paid.getTime() - 60 * 1000)),
      paidAt: iso(paid),
      preparingAt: iso(preparing),
      readyAt: iso(ready),
      completedAt: iso(completedAt),
      cancelledAt: null,
    };
  };

  const history: Order[] = [
    completed("seed-1", priya, [line("orange", 2)], 8, 15, "upi"),
    completed("seed-2", arjun, [line("mango", 1), line("cold-coffee", 1)], 9, 40, "card"),
    completed("seed-3", ravi, [line("watermelon", 1), line("lemon-mint", 1)], 10, 5, "cash"),
    completed("seed-4", priya, [line("chocolate-shake", 1), line("banana-shake", 1)], 11, 20, "upi"),
    completed("seed-5", arjun, [line("pomegranate", 1), line("pineapple", 1)], 13, 10, "upi"),
    completed("seed-6", ravi, [line("mango", 2)], 15, 45, "card"),
    completed("seed-7", priya, [line("mixed-fruit", 1), line("mosambi", 1)], 17, 30, "cash"),
    completed("seed-8", arjun, [line("orange", 1), line("cold-coffee", 2)], 19, 5, "upi"),
  ];

  for (const order of history) {
    store.orders.set(order.id, order);
  }
}
