package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;


import jakarta.validation.constraints.Positive;

public record UpdateGeometryRequest(
        int row,
        int col,
        @Positive int width,
        @Positive int height
) {}