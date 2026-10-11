import { EventEmitter } from "events";

export interface BuildMeEvent {
  id: string;
  type: "trajectory_updated" | "risk_alert" | "checkin_created" | "photo_uploaded" | "task_updated" | "heartbeat";
  projectId: string;
  timestamp: string;
  payload: Record<string, any>;
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    // Allow high subscriber counts across concurrent SSE streams
    this.setMaxListeners(200);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public broadcast(event: Omit<BuildMeEvent, "id" | "timestamp">) {
    const fullEvent: BuildMeEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Emit globally and project-specifically
    this.emit("event", fullEvent);
    if (fullEvent.projectId) {
      this.emit(`project:${fullEvent.projectId}`, fullEvent);
    }
  }
}

export const eventBus = EventBus.getInstance();
