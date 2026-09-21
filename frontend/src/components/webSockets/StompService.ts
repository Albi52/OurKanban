import type { EventDto, TaskDto, TaskMessage } from "@/components/webSockets/useStomp";
import { TOKEN_STORAGE_KEY } from "@/constants";
import { Client, type IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type TaskListener = (message: TaskDto) => void;
export type EventListener = (message: EventDto) => void;
export type ErrorListener = (errorMessage: string) => void;

class StompService {
    private client: Client | null = null;
    private connected = false;
    private activeProjectId: number | null = null;
    private connectionListeners = new Set<(connected: boolean) => void>();
    private taskListeners = new Set<TaskListener>();
    private eventListeners = new Set<EventListener>();
    private errorListeners = new Set<ErrorListener>();

    connect(token?: string | null, projectId?: number) {
        const resolvedToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!resolvedToken) {
            return;
        }

        const subscriptionProjectId = Number(projectId) || null;

        if (this.client?.active && this.activeProjectId === subscriptionProjectId) {
            return;
        }

        if (this.client) {
            this.disconnect();
        }

        const BACKEND_WS_URL = import.meta.env.VITE_WS_URL || "/ws";

        this.client = new Client({
            webSocketFactory: () => new SockJS(BACKEND_WS_URL),
            connectHeaders: {
                Authorization: `Bearer ${resolvedToken}`,
            },
            reconnectDelay: 5000,

            onConnect: (_frame: IFrame) => {
                this.connected = true;
                this.activeProjectId = subscriptionProjectId;
                this.notifyConnection();

                if (subscriptionProjectId !== null) {
                    this.client?.subscribe(`/topic/projects/${subscriptionProjectId}/tasks`, (msg) => {
                        const dto = JSON.parse(msg.body);
                        this.taskListeners.forEach((listener) => listener(dto));
                    });

                    this.client?.subscribe(`/topic/projects/${subscriptionProjectId}/events`, (msg) => {
                        const dto = JSON.parse(msg.body);
                        this.eventListeners.forEach((listener) => listener(dto));
                    });

                    this.client?.subscribe(`/topic/projects/errors`, (msg) => {
                        const errorMessage = JSON.parse(msg.body);
                        this.errorListeners.forEach((listener) => listener(errorMessage));
                    });
                }
                

                console.log("Connected to STOMP server");
            },

            onDisconnect: () => {
                this.connected = false;
                this.activeProjectId = null;
                this.notifyConnection();
                console.log("Disconnected from STOMP server");
            },
        });

        this.client.activate();
    }

    disconnect() {
        this.client?.deactivate();
        this.client = null;
        this.connected = false;
        this.activeProjectId = null;
        this.notifyConnection();
    }

    sendTaskMessage(message: TaskMessage): boolean {
        if (!this.client?.connected) {
            console.warn("No STOMP connection available to send task message");
            return false;
        }

        try {
            this.client.publish({
                destination: "/app/board",
                body: JSON.stringify({
                    type: "Task",
                    data: message,
                }),
            });
            return true;
        } catch (err) {
            console.error("Failed to publish task message:", err);
            return false;
        }
    }

    subscribeTask(listener: TaskListener) {
        this.taskListeners.add(listener);

        return () => {
            this.taskListeners.delete(listener);
        };
    }

    subscribeEvent(listener: EventListener) {
        this.eventListeners.add(listener);
        return () => {
            this.eventListeners.delete(listener);
        };
    }

    subscribeErrors(listener: ErrorListener) {
        this.errorListeners.add(listener);
        return () => {
            this.errorListeners.delete(listener);
        };
    }

    subscribeConnection(listener: (connected: boolean) => void) {
        this.connectionListeners.add(listener);
        listener(this.connected);
        return () => {
            this.connectionListeners.delete(listener);
        };
    }

    private notifyConnection() {
        this.connectionListeners.forEach((listener) => listener(this.connected));
    }
}

export default new StompService();
