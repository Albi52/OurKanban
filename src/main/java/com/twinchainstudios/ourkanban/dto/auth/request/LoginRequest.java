package com.twinchainstudios.ourkanban.dto.auth.request;


public record LoginRequest(String usernameOrEmail, String password) {}