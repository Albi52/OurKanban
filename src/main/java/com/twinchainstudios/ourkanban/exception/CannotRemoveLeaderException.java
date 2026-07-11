package com.twinchainstudios.ourkanban.exception;

public class CannotRemoveLeaderException extends RuntimeException {
    public CannotRemoveLeaderException(String message) { super(message); }
}