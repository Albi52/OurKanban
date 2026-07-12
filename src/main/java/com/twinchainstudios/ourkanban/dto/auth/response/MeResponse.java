package com.twinchainstudios.ourkanban.dto.auth.response;


public record MeResponse(String username, boolean emailVerified, boolean localCredentialsPending) {}