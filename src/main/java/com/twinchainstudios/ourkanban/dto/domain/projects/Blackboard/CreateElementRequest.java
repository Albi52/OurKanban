package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;

import com.twinchainstudios.ourkanban.model.domain.ElementType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateElementRequest(
        int row,
        int col,
        @Positive int width,
        @Positive int height,
        @NotNull ElementType type,
        @Size(max = 2000) String textContent
) {}