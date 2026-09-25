package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.CalendarResponse;
import com.twinchainstudios.ourkanban.service.domain.websockets.EventService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/calendar")


public class CalendarController {

    private final EventService eventService;

    public CalendarController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<CalendarResponse>> getEvents(
            @PathVariable Long projectId,
            Authentication authentication) {
        return ResponseEntity.ok(eventService.getProjectEvents(projectId, authentication.getName()));
    }
}
