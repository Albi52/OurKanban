package com.twinchainstudios.ourkanban.exception;

public class NotLeaderException extends RuntimeException {
    public NotLeaderException(String message) { super(message); }
}