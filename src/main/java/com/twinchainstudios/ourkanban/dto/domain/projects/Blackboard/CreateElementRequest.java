package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;

import com.twinchainstudios.ourkanban.model.domain.AttachmentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateElementRequest(
        Integer row,
        Integer col,
        @Positive int width,
        @Positive int height,
        @NotNull AttachmentType attachmentType,
        @Size(max = 2000) String textContent,
        @Size(max = 2000) String linkUrl
) {}