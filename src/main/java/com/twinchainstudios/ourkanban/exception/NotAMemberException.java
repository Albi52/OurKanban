package com.twinchainstudios.ourkanban.exception;

public class NotAMemberException extends RuntimeException {
    public NotAMemberException(String message) { super(message); }
}