package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.websockets.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.TaskMessage;
import com.twinchainstudios.ourkanban.service.domain.TaskService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class TaskWebSocketController {

    private final TaskService taskService;
    private final SimpMessagingTemplate messagingTemplate;

    public TaskWebSocketController(TaskService taskService, SimpMessagingTemplate messagingTemplate) {
        this.taskService = taskService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/tasks")
    public void onTaskMessage(TaskMessage msg) {
        TaskDto result = taskService.handleMessage(msg);
        if (result != null && result.projectId != null) {
            // broadcast to project-specific topic
            String dest = "/topic/projects/" + result.projectId + "/tasks";
            messagingTemplate.convertAndSend(dest, result);
        }
    }
}
