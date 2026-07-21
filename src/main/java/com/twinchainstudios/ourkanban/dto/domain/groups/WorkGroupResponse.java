package com.twinchainstudios.ourkanban.dto.domain.groups;

import java.util.List;

public record WorkGroupResponse(
        Long id,
        String name,
        String leaderUsername,
        boolean isLeader,
        List<ProjectCapsuleResponse> projects,
        List<MemberResponse> members
) {}