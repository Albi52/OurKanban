package com.twinchainstudios.ourkanban.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank(message = "idToken is required")
        String idToken
) {}