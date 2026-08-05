import type { EventDto, TaskDto, TaskMessage } from "@/components/webSockets/useStomp";
import { Client, type IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type TaskListener = (message: TaskDto) => void;
export type EventListener = (message: EventDto) => void;

class StompService {

    private client: Client | null = null;
    private connected = false;
    private connectionListeners = new Set<(connected: boolean) => void>();
    private taskListeners = new Set<TaskListener>();
    private eventListeners = new Set<EventListener>();


    connect() {
        if (this.client) return;
        const BACKEND_WS_URL =
            import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

        const token = localStorage.getItem("token");
        this.client = new Client({
            webSocketFactory: () => new SockJS(BACKEND_WS_URL),
            connectHeaders: token
                ? { Authorization: `Bearer ${token}` }
                : {},
            reconnectDelay: 5000,

            onConnect: (_frame: IFrame) => {
                this.connected = true;
                this.notifyConnection();
                this.client?.subscribe("/topic/tasks", msg => {
                    const dto = JSON.parse(msg.body);
                    this.taskListeners.forEach(l => l(dto));
                });

                this.client?.subscribe("/topic/events", msg => {
                    const dto = JSON.parse(msg.body);
                    this.eventListeners.forEach(l => l(dto));
                });
                console.log("Connected to STOMP server");

            },

            onDisconnect: () => {
                this.connected = false;
                this.notifyConnection();
                console.log("Disconnected from STOMP server");
            }

        });

        this.client.activate();

    }


    disconnect() {

        this.client?.deactivate();
        this.client = null;
        this.connected = false;
        this.notifyConnection();
    }


    sendTaskMessage(message: TaskMessage) {
        if (!this.client?.connected)
            return;

        this.client.publish({
            destination: "/app/board",
            body: JSON.stringify({
                type: "Task",
                data: message
            })
        });

        console.log("Sent task message:", message);

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


    subscribeConnection(listener: (c: boolean) => void) {
        this.connectionListeners.add(listener);
        listener(this.connected);
        return () => {
            this.connectionListeners.delete(listener);
        };
    }


    private notifyConnection() {
        this.connectionListeners.forEach(l => l(this.connected));
    }

}

export default new StompService();