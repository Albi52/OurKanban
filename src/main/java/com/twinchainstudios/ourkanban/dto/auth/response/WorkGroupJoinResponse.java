package com.twinchainstudios.ourkanban.dto.auth.response;

public record WorkGroupJoinResponse(
    String workGroupName,
    String invitedUserName,
    String invitedUserProfilePicture
) {
}
