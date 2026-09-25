package com.twinchainstudios.ourkanban.dto.domain.projects;

import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;

public record ColumnResponse(Long id, String name, int position, int numTasks, TaskDto[] tasks) {}
