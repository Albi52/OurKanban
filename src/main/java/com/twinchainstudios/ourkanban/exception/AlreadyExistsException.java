package com.twinchainstudios.ourkanban.exception;

public class AlreadyExistsException extends RuntimeException {

        public AlreadyExistsException(String entity) {
            super(entity + " already exists.");
    }
}
