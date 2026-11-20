import cookieParser from "cookie-parser";
import express from "express";
import { lanIPv4 } from "./lan.js";
import { attachUser } from "./middleware/auth.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter, paymentsRouter } from "./routes/orders.js";
import { seed } from "./seed.js";

seed();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/events", eventsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route ${req.method} ${req.path}` });
});

app.listen(PORT, "0.0.0.0", () => {
  const lan = lanIPv4();
  console.log(`API listening on http://0.0.0.0:${PORT}`);
  if (lan) console.log(`API LAN:        http://${lan}:${PORT}`);
});
