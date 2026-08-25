package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateLinkRequest(
        @NotBlank @Size(max = 2000) String linkUrl
) {}