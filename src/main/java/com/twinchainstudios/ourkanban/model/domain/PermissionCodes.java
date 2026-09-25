package com.twinchainstudios.ourkanban.model.domain;

import java.util.Set;

public final class PermissionCodes {
    public static final String PROJECT_CREATE = "PROJECT_CREATE";
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

    public static Set<String> getCreatePermissionCodes() {
        return Set.of(
            PROJECT_CREATE, 
            TASK_CREATE, 
            EVENT_CREATE
        );
    }

    public static Set<String> getEditPermissionCodes() {
        return Set.of(
            PROJECT_EDIT, 
            TASK_EDIT, 
            EVENT_EDIT
        );
    }

    public static Set<String> getDeletePermissionCodes() {
        return Set.of(
            PROJECT_DELETE, 
            TASK_DELETE, 
            EVENT_DELETE
        );
    }

    public static Set<String> getMemberPermissionCodes() {
        return Set.of(
            MEMBER_ADD, 
            MEMBER_REMOVE, 
            MEMBER_EDIT
        );
    }

    public static Set<String> getAllPermissionCodes() {
        return Set.of(
            PROJECT_CREATE, 
            PROJECT_VIEW, 
            PROJECT_EDIT, 
            PROJECT_DELETE,
            TASK_CREATE, 
            TASK_EDIT, 
            TASK_DELETE,
            EVENT_CREATE, 
            EVENT_EDIT, 
            EVENT_DELETE,
            MEMBER_ADD, 
            MEMBER_REMOVE, 
            MEMBER_EDIT
        );
    }

}