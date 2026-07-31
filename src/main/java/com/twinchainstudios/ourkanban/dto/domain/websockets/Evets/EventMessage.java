package com.twinchainstudios.ourkanban.dto.domain.websockets.Evets;

import java.time.LocalDateTime;

import com.twinchainstudios.ourkanban.model.domain.EventType;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;


public class EventMessage {
    // action: CREATE | MOVE | UPDATE | DELETE
    public String action;
    
    public Long eventId;      // para MOVE/UPDATE/DELETE
    public Long projectId;
    public String text;
    public LocalDateTime date;
    public EventType type; 
    public Project project;

    public EventMessage() {}
}
