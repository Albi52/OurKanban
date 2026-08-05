package com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks;

import java.time.LocalDate;

public class TaskMessage {
    // action: CREATE | MOVE | UPDATE | DELETE
    public String action;

    public Long taskId;      // para MOVE/UPDATE/DELETE
    public String title;     // para CREATE/UPDATE
    public String description; // para CREATE/UPDATE    
    public Long columnId;    // para CREATE/UPDATE/MOVE
    public Long assigneeId;  // para CReATE/UPDATE

    public String priority; // para CREATE/UPDATE

    public LocalDate dateStart; // para CREATE/UPDATE
    public LocalDate dateEnd;   // para CREATE/UPDATE

    //Only for CREATE
    public Long projectId;   // target project (required)

    //Only for MOVE
    public int positionX;      // for MOVE
    public int positionY;      // for MOVE

    public TaskMessage() {}
}