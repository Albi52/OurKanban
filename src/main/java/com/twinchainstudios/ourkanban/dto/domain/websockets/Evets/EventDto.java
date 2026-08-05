package com.twinchainstudios.ourkanban.dto.domain.websockets.Evets;

import java.time.LocalDateTime;

import com.twinchainstudios.ourkanban.model.domain.EventType;

public class EventDto {
    
    public Long id;
    public String text;
    public LocalDateTime date;
    public String type; 
    public Long projectId;
    public Long authorId;
    public String authorName;

    public EventDto() {}

    public EventDto(Long id, String text, LocalDateTime date, EventType type, Long projectId, Long authorId, String authorName) {
        this.id = id;
        this.text = text;
        this.date = date;
        this.type = type.toString();
        this.projectId = projectId;
        this.authorId = authorId;
        this.authorName = authorName;
    }
}