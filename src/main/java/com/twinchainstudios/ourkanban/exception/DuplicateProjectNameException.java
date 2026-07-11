package com.twinchainstudios.ourkanban.exception;

public class DuplicateProjectNameException extends RuntimeException {
    public DuplicateProjectNameException(String message) { super(message); }
}