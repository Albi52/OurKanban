package com.twinchainstudios.ourkanban.exception;

public class InvalidCurrentPasswordException extends RuntimeException {
    public InvalidCurrentPasswordException(String message) { super(message); }
}