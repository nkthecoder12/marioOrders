import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { addSseClient, removeSseClient } from "../services/sse.js";

export const eventsRouter = Router();

eventsRouter.get("/", requireAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(": connected\n\n");

  const client = addSseClient(res, req.user!.id, req.user!.role);
  req.on("close", () => {
    removeSseClient(client);
  });
});
