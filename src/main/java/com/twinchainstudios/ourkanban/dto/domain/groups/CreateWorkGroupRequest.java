package com.twinchainstudios.ourkanban.dto.domain.groups;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkGroupRequest(
        @NotBlank(message = "Group name is required")
        @Size(max = 60, message = "Group name must be at most 60 characters")
        String name
) {}