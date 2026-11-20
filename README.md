# Mario Juice — demo ordering MVP

Hardcoded, in-memory juice shop with a customer phone UI and an admin phone UI. Orders and menu changes sync live over Server-Sent Events. Restarting the server wipes data and reseeds it.

## Setup

```bash
npm install
npm run dev
```

One command starts Express (`:3001`) and Vite (`:5173`). Vite proxies `/api` to Express.

The terminal prints a LAN URL, for example:

```
Customer + Admin UI:  http://192.168.1.24:5173
```

Open that URL on phones on the **same Wi-Fi**. Do not use `localhost` on the phone.

### Windows firewall

If the phone cannot load the page, allow Node/Vite through the firewall (PowerShell as Administrator):

```powershell
New-NetFirewallRule -DisplayName "Mario Juice Vite" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

Port 3001 is only needed on the machine running the demo (the browser talks to Vite, which proxies `/api`).

## Logins (no signup)

| Role     | Email             | Password |
|----------|-------------------|----------|
| Customer | user@demo.com     | user123  |
| Admin    | admin@demo.com    | admin123 |

Customer lands on `/menu`. Admin lands on `/admin`. Customers receive `403` on every `/api/admin/*` route.

## 2-minute demo script

Use two phones (or a phone + this computer).

1. **Phone 1 — customer**  
   Log in as `user@demo.com` / `user123`. Add Orange and Watermelon. Open the cart bar, proceed to pay, pick UPI, tap **Pay**. After the short spinner you get a token (historical seed orders use #1–#8, so a new order is **#9**).

2. **Phone 2 — admin**  
   Log in as `admin@demo.com` / `admin123`. The new order appears in **New** with a highlight and a short beep (tap the screen once first so the browser allows audio).

3. **Live status**  
   On the admin queue tap **Start preparing**, then **Mark ready**. Phone 1’s token screen stepper updates live. When the order is Ready, Phone 1 shows **Your juice is ready! 🎉** and vibrates if the device allows it.

4. **Sold out**  
   Admin → Menu, turn **Mango** off. Phone 1’s menu shows Mango as **Sold out** without refresh. If Mango is already in a cart, checkout returns a clear error.

5. **Dashboard**  
   Admin → Dashboard. Today’s revenue, completed count, queue count, average order value, top sellers, hourly bars, and a CRM table (Ravi, Priya, Arjun) are already populated from 8 seeded completed orders.

## Stack

- React + Vite + TypeScript + Tailwind + React Router
- Express + TypeScript, in-memory `Map`s (no database)
- Session cookie (`sid`, HttpOnly, SameSite=Lax, not Secure — this demo is HTTP on LAN)
- SSE on `GET /api/events` (cookie auth, 25s heartbeat)

Prices are stored in **paise** on the server. The UI formats rupees.
