package com.twinchainstudios.ourkanban.dto.domain.groups;


import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(
        @NotBlank(message = "Username is required")
        String username
) {}