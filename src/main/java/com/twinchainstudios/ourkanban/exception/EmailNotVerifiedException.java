package com.twinchainstudios.ourkanban.exception;

public class EmailNotVerifiedException extends RuntimeException {
    public EmailNotVerifiedException(String message) { super(message); }
}