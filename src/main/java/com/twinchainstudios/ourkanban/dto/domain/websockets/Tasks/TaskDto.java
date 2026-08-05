package com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks;

import java.time.LocalDate;

public class TaskDto {
    public Long id;

    public String title;
    public String description;
    public String priority;

    public Long columnId;
    public Long projectId;

    public Long assigneeId;    
    public String assigneeName;

    public Long authorId;
    public String authorName;

    public LocalDate startDate;
    public LocalDate endDate;   

    public int positionX;
    public int positionY;

    public String moverName;

    public TaskDto() {}

    public TaskDto(Long id, String title, String description, String priority, 
        Long columnId, Long projectId, 
        Long assigneeId, String assigneeName, Long authorId, String authorName,
        int positionX, int positionY, LocalDate startDate, LocalDate endDate,
        String moverName
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.columnId = columnId;
        this.projectId = projectId;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.authorId = authorId;
        this.authorName = authorName;
        this.positionX = positionX;
        this.positionY = positionY;
        this.startDate = startDate;
        this.endDate = endDate;
        this.moverName = moverName;
    }
}