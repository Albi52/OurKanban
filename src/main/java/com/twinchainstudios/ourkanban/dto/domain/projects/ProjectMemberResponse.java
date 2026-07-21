package com.twinchainstudios.ourkanban.dto.domain.projects;


public record ProjectMemberResponse(Long id, Long userId, String username, String displayName) {}