package com.twinchainstudios.ourkanban.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid username/email or password"));
    }
    @ExceptionHandler(WorkGroupNotFoundException.class)
public ResponseEntity<Map<String, String>> handleWorkGroupNotFound(WorkGroupNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
}

@ExceptionHandler(NotAMemberException.class)
public ResponseEntity<Map<String, String>> handleNotAMember(NotAMemberException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
}
    @ExceptionHandler(NotLeaderException.class)
public ResponseEntity<Map<String, String>> handleNotLeader(NotLeaderException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
}

@ExceptionHandler(ProjectNotFoundException.class)
public ResponseEntity<Map<String, String>> handleProjectNotFound(ProjectNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
}

@ExceptionHandler(DuplicateProjectNameException.class)
public ResponseEntity<Map<String, String>> handleDuplicateProject(DuplicateProjectNameException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(AlreadyMemberException.class)
public ResponseEntity<Map<String, String>> handleAlreadyMember(AlreadyMemberException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
}

@ExceptionHandler(CannotRemoveLeaderException.class)
public ResponseEntity<Map<String, String>> handleCannotRemoveLeader(CannotRemoveLeaderException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(UsernameNotFoundException.class)
public ResponseEntity<Map<String, String>> handleUsernameNotFound(UsernameNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new LinkedHashMap<>();
    for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
        errors.put(fieldError.getField(), fieldError.getDefaultMessage());
    }
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
}

@ExceptionHandler(InvalidVerificationTokenException.class)
public ResponseEntity<Map<String, String>> handleInvalidVerificationToken(InvalidVerificationTokenException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(EmailNotVerifiedException.class)
public ResponseEntity<Map<String, String>> handleEmailNotVerified(EmailNotVerifiedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(InvalidCurrentPasswordException.class)
public ResponseEntity<Map<String, String>> handleInvalidCurrentPassword(InvalidCurrentPasswordException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
}
@ExceptionHandler(ProjectMemberNotFoundException.class)
public ResponseEntity<Map<String, String>> handleProjectMemberNotFound(ProjectMemberNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
}
}