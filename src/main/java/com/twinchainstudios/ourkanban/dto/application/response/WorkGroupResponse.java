package com.twinchainstudios.ourkanban.dto.application.response;

import java.util.List;

public record WorkGroupResponse(
        Long id,
        String name,
        String leaderUsername,
        boolean isLeader,
        List<ProjectResponse> projects,
        List<MemberResponse> members
) {}