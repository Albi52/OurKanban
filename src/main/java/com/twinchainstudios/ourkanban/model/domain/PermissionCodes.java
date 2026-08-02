package com.twinchainstudios.ourkanban.model.domain;

public final class PermissionCodes {
    public static final String PROJECT_VIEW = "PROJECT_VIEW";
    public static final String PROJECT_EDIT = "PROJECT_EDIT";
    public static final String PROJECT_DELETE = "PROJECT_DELETE";
    
    public static final String TASK_CREATE = "TASK_CREATE";
    public static final String TASK_EDIT = "TASK_EDIT";
    public static final String TASK_DELETE = "TASK_DELETE";

    public static final String EVENT_CREATE = "EVENT_CREATE";
    public static final String EVENT_EDIT = "EVENT_EDIT";
    public static final String EVENT_DELETE = "EVENT_DELETE";

    public static final String MEMBER_ADD = "MEMBER_ADD";
    public static final String MEMBER_REMOVE = "MEMBER_REMOVE";
    public static final String MEMBER_EDIT = "MEMBER_EDIT";

    private PermissionCodes() {}
}