package com.twinchainstudios.ourkanban.dto.auth.response;

public record WorkGroupJoinResponse(
    Long workGroupId,
    String workGroupName,
    String invitedUserName,
    String invitedUserProfilePicture
) {
}
