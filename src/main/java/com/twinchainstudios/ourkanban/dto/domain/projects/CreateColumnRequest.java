package com.twinchainstudios.ourkanban.dto.domain.projects;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateColumnRequest(
        @NotBlank(message = "Column name is required")
        @Size(max = 60, message = "Column name must be at most 60 characters")
        String name
) {}
