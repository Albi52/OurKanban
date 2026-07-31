package com.twinchainstudios.ourkanban.dto.domain.websockets.Evets;

import java.time.LocalDateTime;

import com.twinchainstudios.ourkanban.model.domain.EventType;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;

public class EventDto {
    
    public Long id;
    public String text;
    public LocalDateTime date;
    public EventType type; 
    public Long projectId;

    public EventDto() {}

    public EventDto(Long id, String text, LocalDateTime date, EventType type, Long projectId) {
        this.id = id;
        this.text = text;
        this.date = date;
        this.type = type;
        this.projectId = projectId;
    }
}