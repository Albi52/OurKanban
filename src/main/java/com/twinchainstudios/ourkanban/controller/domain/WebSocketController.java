package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.websockets.BoardMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventMessage;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.service.domain.websockets.EventService;
import com.twinchainstudios.ourkanban.service.domain.websockets.TaskService;

import tools.jackson.databind.ObjectMapper;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.twinchainstudios.ourkanban.dto.auth.UserPrincipal;

import java.security.Principal;

//import org.springframework.beans.factory.annotation.Autowired;
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
        SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) 
        {

        this.taskService = taskService;
        this.eventService = eventService;
        this.messagingTemplate = messagingTemplate;
            this.objectMapper = objectMapper;
    }

    @MessageMapping("/board")
    public void onBoardMessage(BoardMessage msg, Principal principal) {
        if (msg.type == null || msg.data == null) {
            return; // Invalid message
        }
        Authentication authentication =
            (Authentication) SecurityContextHolder.getContext().getAuthentication();

        UserPrincipal userPrincipal =
                (UserPrincipal) authentication.getPrincipal();

        Long userId = userPrincipal.getId();

        System.out.println("Principal = " + principal);

        if (principal != null) {
            System.out.println(principal.getClass().getName());
        }


        switch (msg.type) {
            case Task:
                System.out.println("Received Task message: " + msg.data);
                TaskMessage taskMessage = objectMapper.convertValue(msg.data, TaskMessage.class);
                TaskDto taskDto = taskService.handleMessage(taskMessage, userId);

                if (taskDto.projectId != null) {
                    messagingTemplate.convertAndSend("/topic/projects/" + taskDto.projectId + "/tasks", taskDto);
                } else {
                    messagingTemplate.convertAndSend("/topic/tasks", taskDto);
                }
                break;
            case Event:
                System.out.println("Received Event message: " + msg.data);
                EventDto eventsDto= eventService.handleMessage((EventMessage) msg.data, userId);
                messagingTemplate.convertAndSend("/topic/events", eventsDto);
                break;
            default:
                // Handle other message types if needed
                break;
        }
    }
}
