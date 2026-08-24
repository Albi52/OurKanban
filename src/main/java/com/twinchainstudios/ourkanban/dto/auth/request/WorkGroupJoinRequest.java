package com.twinchainstudios.ourkanban.dto.auth.request;

public record WorkGroupJoinRequest(
    Long workGroupId,
    String username
) {
    
}
