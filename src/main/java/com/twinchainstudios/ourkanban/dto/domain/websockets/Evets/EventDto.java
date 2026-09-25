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
    public String action; 
    public Integer positionX;
    public Integer positionY;
    public String moverName;

    public EventDto() {}

    public EventDto(Long id, String text, LocalDateTime date, EventType type, Long projectId, Long authorId, String authorName, String action, Integer positionX, Integer positionY, String moverName) {
        this.id = id;
        this.text = text;
        this.date = date;
        this.type = type.toString();
        this.projectId = projectId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.action = action;
        this.positionX = positionX;
        this.positionY = positionY;
        this.moverName = moverName;
    }
}