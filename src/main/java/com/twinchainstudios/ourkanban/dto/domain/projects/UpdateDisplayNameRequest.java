package com.twinchainstudios.ourkanban.dto.application.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDisplayNameRequest(
        @NotBlank(message = "Display name is required")
        @Size(max = 50, message = "Display name must be at most 50 characters")
        String displayName
) {}