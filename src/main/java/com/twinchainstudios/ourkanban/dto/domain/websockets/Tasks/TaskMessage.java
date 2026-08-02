package com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks;

public class TaskMessage {
    // action: CREATE | MOVE | UPDATE | DELETE
    public String action;

    public Long taskId;      // para MOVE/UPDATE/DELETE
    public String title;     // para CREATE/UPDATE
    public Long columnId;    // para CREATE/MOVE
    public Long projectId;   // target project (required)
    public Long assigneeId;  // optional
    public int positionX;      // optional, for MOVE
    public int positionY;      // optional, for MOVE

    public TaskMessage() {}
}