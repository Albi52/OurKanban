package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;


import jakarta.validation.constraints.Size;

public record UpdateContentRequest(
        @Size(max = 2000) String textContent
) {}