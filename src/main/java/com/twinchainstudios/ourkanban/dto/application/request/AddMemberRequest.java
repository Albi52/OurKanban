package com.twinchainstudios.ourkanban.dto.application.request;


import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(
        @NotBlank(message = "Username is required")
        String username
) {}