package com.twinchainstudios.ourkanban.dto.domain.projects;

import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventDto;

public record CalendarResponse(int projectId, int numEvents, EventDto[] events) {}