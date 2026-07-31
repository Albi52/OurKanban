package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.websockets.BoardMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.service.auth.UserSearchService;
import com.twinchainstudios.ourkanban.service.domain.websockets.EventService;
import com.twinchainstudios.ourkanban.service.domain.websockets.TaskService;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private final TaskService taskService;
    private final EventService eventService;
    
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(
        TaskService taskService, 
        EventService eventService, 
        SimpMessagingTemplate messagingTemplate
    ) 
        {

        this.taskService = taskService;
        this.eventService = eventService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/board")
    public void onBoardMessage(BoardMessage msg) {
        if (msg.type == null || msg.data == null) {
            return; // Invalid message
        }

        switch (msg.type) {
            case Task:
                TaskDto taskDto = taskService.handleMessage((TaskMessage) msg.data);
                messagingTemplate.convertAndSend("/topic/tasks", taskDto);
                break;
            case Event:
                EventDto eventsDto= eventService.handleMessage((EventMessage) msg.data);
                messagingTemplate.convertAndSend("/topic/events", eventsDto);
                break;
            default:
                // Handle other message types if needed
                break;
        }
    }
}
