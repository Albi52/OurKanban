package com.twinchainstudios.ourkanban.dto.domain.projects;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 60, message = "Project name must be at most 60 characters")
        String name
) {}