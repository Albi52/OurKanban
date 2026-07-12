package com.twinchainstudios.ourkanban.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequest(
        String currentPassword, // null/blank allowed only when setting a password for the first time

        @NotBlank(message = "New password is required")
        @Size(min = 3, max = 100, message = "Password must be at least 3 characters")
        String newPassword
) {}