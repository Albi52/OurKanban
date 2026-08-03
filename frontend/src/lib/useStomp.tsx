import { useEffect, useRef, useState } from "react";
import { Client } from '@stomp/stompjs'
//import type { IFrame } from '@stomp/stompjs'
import SockJS from 'sockjs-client'


export type TaskMessage = {
  action: "CREATE" | "MOVE" | "UPDATE" | "DELETE";
  taskId?: number;
  title?: string;
  columnId?: number;
  projectId: number;
  assigneeId?: number;
};

export type TaskDto = {
  id: number;
  title: string;
  columnId?: number;
  projectId?: number;
  assigneeId?: number;
};

export function useStomp(projectId: number, onMessage: (m: TaskDto) => void) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      // webSocketFactory is recommended with SockJS
      webSocketFactory: () => new SockJS(`${window.location.protocol}//${window.location.host}/ws`),
      reconnectDelay: 5000,
      //debug: (str) => { /* console.log(str) */ },
      onConnect: (/*frame: IFrame*/) => {
        setConnected(true);
        // subscribe to project topic
        /*const sub =*/ client.subscribe(`/topic/projects/${projectId}/tasks`, (msg) => {
          if (msg.body) {
            try {
              const dto: TaskDto = JSON.parse(msg.body);
              onMessage(dto);
            } catch (e) { console.error("Invalid task msg", e); }
          }
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [projectId, onMessage]);

  function sendTaskMessage(message: TaskMessage) {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("STOMP client not connected");
      return;
    }
    clientRef.current.publish({
      destination: "/app/tasks",
      body: JSON.stringify(message),
    });
  }

  return { connected, sendTaskMessage };
}
