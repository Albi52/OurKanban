package com.twinchainstudios.ourkanban.dto.domain.groups;

import com.twinchainstudios.ourkanban.dto.domain.projects.ProjectMemberResponse;

public record ProjectDetailsResponse(Long id, String name, Long workGroupId, boolean isLeader, java.util.List<ProjectMemberResponse> members) {}
