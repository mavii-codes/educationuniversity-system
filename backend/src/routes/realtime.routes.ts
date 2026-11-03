import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { subscribeToRealtimeUpdates } from "../services/realtime.service";

const router = Router();

router.get("/events", requireAuth, (req, res) => {
  const clientId = req.query.clientId;
  res.set({
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  const unsubscribe = subscribeToRealtimeUpdates(
    res,
    typeof clientId === "string" && /^[a-zA-Z0-9-]{1,64}$/.test(clientId)
      ? clientId
      : undefined
  );
  res.on("close", unsubscribe);
});

export default router;
