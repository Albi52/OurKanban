package com.twinchainstudios.ourkanban.exception;

public class ProjectMemberNotFoundException extends RuntimeException {
    public ProjectMemberNotFoundException(String message) { super(message); }
}