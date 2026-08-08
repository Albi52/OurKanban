import { useEffect, useState } from "react";
import stompService from "./StompService";

export type BoardMessageType = 'Task' | 'Column' | 'Event'
export type TaskAction = 'CREATE' | 'MOVE' | 'UPDATE' | 'DELETE'

export type TaskMessage = {
  action: TaskAction
  taskId?: number | null
  title?: string | null
  description?: string | null
  columnId?: number | null
  assigneeId?: number | null
  priority?: string | null
  dateStart?: string | null
  dateEnd?: string | null
  projectId?: number | null
  positionX?: number
  positionY?: number
}

export type TaskDto = {
  id: number
  title?: string
  description?: string
  priority?: string
  columnId?: number
  projectId?: number
  assigneeId?: number
  assigneeName?: string
  authorId?: number
  authorName?: string
  startDate?: string
  endDate?: string
  positionX?: number
  positionY?: number
  moverName?: string
}

export type EventDto = {
  id: number
  text: string
  date: string
  type: string
  projectId: number
  authorId: number
  authorName: string
}

export type BoardResponse = TaskDto | EventDto

export function useStomp() {

    const [connected, setConnected] = useState(false);

    useEffect(() => {

        //stompService.connect();

        const unsubscribe =
            stompService.subscribeConnection(setConnected);

        return unsubscribe;

    }, []);

    return {

        connected,

        sendTaskMessage: stompService.sendTaskMessage.bind(stompService),

        subscribeTaskMessages: stompService.subscribeTask.bind(stompService),

        subscribeEventMessages: stompService.subscribeEvent.bind(stompService)

    };

}