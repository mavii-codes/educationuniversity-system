import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { getDbPool } from "../config/database";

const CHANNEL = "udis_realtime_updates";
const clients = new Set<{ response: import("express").Response; clientId?: string }>();
const recentEventIds = new Set<string>();
let listenerClient: PoolClient | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let shuttingDown = false;

export interface RealtimeEvent {
  id: string;
  type: "data-changed";
  clientId?: string;
  timestamp: string;
}

function broadcast(event: RealtimeEvent): void {
  if (recentEventIds.has(event.id)) return;
  recentEventIds.add(event.id);
  if (recentEventIds.size > 500) {
    const oldestId = recentEventIds.values().next().value;
    if (oldestId) recentEventIds.delete(oldestId);
  }

  const message = `event: data-changed\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    if (client.response.destroyed) {
      clients.delete(client);
      continue;
    }
    client.response.write(message);
  }
}

export function subscribeToRealtimeUpdates(
  response: import("express").Response,
  clientId?: string
): () => void {
  const client = { response, clientId };
  clients.add(client);
  response.write("event: connected\ndata: {}\n\n");
  const keepAlive = setInterval(() => response.write(": keep-alive\n\n"), 20_000);

  return () => {
    clearInterval(keepAlive);
    clients.delete(client);
  };
}

async function connectListener(): Promise<void> {
  if (shuttingDown || listenerClient) return;
  const pool = getDbPool();
  if (!pool) return;

  try {
    const client = await pool.connect();
    listenerClient = client;
    client.on("notification", (notification) => {
      if (notification.channel !== CHANNEL || !notification.payload) return;
      try {
        broadcast(JSON.parse(notification.payload) as RealtimeEvent);
      } catch (error) {
        console.error("[realtime] Ignoring malformed PostgreSQL notification:", error);
      }
    });
    client.on("error", (error) => {
      console.error("[realtime] PostgreSQL notification listener failed:", error.message);
      if (listenerClient === client) {
        listenerClient = null;
        client.release(true);
        scheduleReconnect();
      }
    });
    await client.query(`LISTEN ${CHANNEL}`);
  } catch (error) {
    if (listenerClient) {
      listenerClient.release(true);
      listenerClient = null;
    }
    console.error("[realtime] Could not start PostgreSQL notification listener:", error);
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (shuttingDown || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectListener();
  }, 5_000);
  reconnectTimer.unref();
}

export function startRealtimeListener(): Promise<void> {
  return connectListener();
}

export async function publishRealtimeUpdate(clientId?: string): Promise<void> {
  const event: RealtimeEvent = {
    id: randomUUID(),
    type: "data-changed",
    clientId,
    timestamp: new Date().toISOString(),
  };
  broadcast(event);

  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query("SELECT pg_notify($1, $2)", [CHANNEL, JSON.stringify(event)]);
  } catch (error) {
    console.error("[realtime] Failed to publish PostgreSQL notification:", error);
  }
}

export function stopRealtimeListener(): void {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (listenerClient) {
    listenerClient.release();
    listenerClient = null;
  }
}
