package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.websockets.BoardMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.service.domain.websockets.EventService;
import com.twinchainstudios.ourkanban.service.domain.websockets.TaskService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import com.twinchainstudios.ourkanban.dto.auth.UserPrincipal;

import java.security.Principal;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private final TaskService taskService;
    private final EventService eventService;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(
            TaskService taskService, 
            EventService eventService, 
            SimpMessagingTemplate messagingTemplate, 
            ObjectMapper objectMapper) {
        this.taskService = taskService;
        this.eventService = eventService;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @MessageMapping("/board")
    public void onBoardMessage(BoardMessage msg, Principal principal) {
        UserPrincipal userPrincipal = null;

        if (principal instanceof Authentication) {
            Object p = ((Authentication) principal).getPrincipal();
            if (p instanceof UserPrincipal) {
                userPrincipal = (UserPrincipal) p;
            }
        } else if (principal instanceof UserPrincipal) {
            userPrincipal = (UserPrincipal) principal;
        }

        if (userPrincipal == null) {
            System.out.println("WebSocket message received without authenticated principal; principal=" + principal);
            return;
        }

        Long userId = userPrincipal.getId();

        if (msg == null || msg.type == null) {
            return;
        }

        switch (msg.type) {
            case Task:
                TaskMessage taskMessage = objectMapper.convertValue(msg.data, TaskMessage.class);
                TaskDto taskDto = taskService.handleMessage(taskMessage, userId);

                if (taskDto != null && taskDto.projectId != null) {
                    // Se envía al topic de tasks que escucha StompService.ts
                    messagingTemplate.convertAndSend("/topic/projects/" + taskDto.projectId + "/tasks", taskDto);
                }
                break;

            case Event:
                EventMessage eventMessage = objectMapper.convertValue(msg.data, EventMessage.class);
                EventDto eventsDto = eventService.handleMessage(eventMessage, userId);

                if (eventsDto != null && eventsDto.projectId != null) {
                    // Se envía al topic de events que escucha StompService.ts
                    messagingTemplate.convertAndSend("/topic/projects/" + eventsDto.projectId + "/events", eventsDto);
                }
                break;

            default:
                break;
        }
    }
}