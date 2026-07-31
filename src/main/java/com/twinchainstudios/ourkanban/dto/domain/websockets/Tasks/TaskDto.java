package com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks;

public class TaskDto {
    public Long id;
    public String title;
    public Long columnId;
    public Long projectId;
    public Long assigneeId;
    public String assigneeName;
    public Long authorId;
    public String authorName;

    public TaskDto() {}

    public TaskDto(Long id, String title, Long columnId, Long projectId, Long assigneeId, String assigneeName, Long authorId, String authorName) {
        this.id = id;
        this.title = title;
        this.columnId = columnId;
        this.projectId = projectId;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.authorId = authorId;
        this.authorName = authorName;
    }
}