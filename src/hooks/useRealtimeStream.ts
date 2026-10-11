"use client";

import { useEffect, useState, useCallback } from "react";
import type { BuildMeEvent } from "@/lib/events";

interface UseRealtimeStreamOptions {
  projectId?: string;
  onEvent?: (event: BuildMeEvent) => void;
}

export function useRealtimeStream(options: UseRealtimeStreamOptions = {}) {
  const { projectId, onEvent } = options;
  const [events, setEvents] = useState<BuildMeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const url = projectId
      ? `/api/stream?projectId=${encodeURIComponent(projectId)}`
      : "/api/stream";

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          setIsConnected(true);
          setLastError(null);
        };

        eventSource.onmessage = (e) => {
          try {
            const data: BuildMeEvent = JSON.parse(e.data);
            if (data.type !== "heartbeat") {
              setEvents((prev) => [data, ...prev.slice(0, 49)]); // keep latest 50 events
            }
            onEvent?.(data);
          } catch (parseErr) {
            console.error("[useRealtimeStream] Error parsing SSE event payload:", parseErr);
          }
        };

        eventSource.onerror = (err) => {
          setIsConnected(false);
          setLastError("SSE stream disconnected. Reconnecting...");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry connection after 5s
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err: any) {
        setIsConnected(false);
        setLastError(err?.message || "Failed to establish SSE stream");
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [projectId, onEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    lastError,
    clearEvents,
  };
}
