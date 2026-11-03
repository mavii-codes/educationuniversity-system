"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { API_CONFIG, getRealtimeClientId } from "@/lib/api";

export function RealtimeUpdates() {
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!API_CONFIG.useLiveApi || !isAuthenticated || isInitializing) return;

    const clientId = getRealtimeClientId();
    const url = new URL(`${API_CONFIG.baseUrl}/events`);
    if (clientId) url.searchParams.set("clientId", clientId);

    const source = new EventSource(url.toString(), { withCredentials: true });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    source.addEventListener("data-changed", (message) => {
      try {
        const event = JSON.parse((message as MessageEvent<string>).data) as {
          clientId?: string;
        };
        if (event.clientId && event.clientId === clientId) return;
      } catch {
        return;
      }

      if (!refreshTimer) {
        refreshTimer = setTimeout(() => window.location.reload(), 250);
      }
    });

    return () => {
      source.close();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [isAuthenticated, isInitializing]);

  return null;
}
