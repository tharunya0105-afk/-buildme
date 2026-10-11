import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventBus, BuildMeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connection ping
      const initialPayload: BuildMeEvent = {
        id: `init_${Date.now()}`,
        type: "heartbeat",
        projectId: projectId || "global",
        timestamp: new Date().toISOString(),
        payload: { message: "Connected to BuildMe Realtime Event Stream" },
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`));

      // Listener for incoming events
      const onEvent = (event: BuildMeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      const eventChannel = projectId ? `project:${projectId}` : "event";
      eventBus.on(eventChannel, onEvent);

      // Keepalive heartbeat every 15 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const ping: BuildMeEvent = {
            id: `ping_${Date.now()}`,
            type: "heartbeat",
            projectId: projectId || "global",
            timestamp: new Date().toISOString(),
            payload: { status: "alive" },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ping)}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Cleanup when stream closes
      req.signal.addEventListener("abort", () => {
        eventBus.off(eventChannel, onEvent);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // ignore already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
