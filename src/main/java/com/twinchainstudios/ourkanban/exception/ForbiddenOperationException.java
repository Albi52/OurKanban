package com.twinchainstudios.ourkanban.exception;

public class ForbiddenOperationException extends RuntimeException {
    public ForbiddenOperationException(String message) { super(message); }

}
