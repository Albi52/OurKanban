package com.twinchainstudios.ourkanban.controller;


import com.twinchainstudios.ourkanban.dto.auth.request.GoogleLoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.AuthResponse;
import com.twinchainstudios.ourkanban.dto.auth.response.MeResponse;
import com.twinchainstudios.ourkanban.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {


    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/protected")
    public String protectd() {
        return "Welcome to the protected section of the OurKanban API!";
    }

   

      @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping("/login/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }
    @GetMapping("/verify-email")
public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
    authService.verifyEmail(token);
    return ResponseEntity.ok(Map.of("message", "Email verified successfully"));

    
}

@GetMapping("/me")
public ResponseEntity<MeResponse> me(Authentication authentication) {
    return ResponseEntity.ok(authService.getMe(authentication.getName()));
}

@PostMapping("/resend-verification")
public ResponseEntity<Void> resendVerification(Authentication authentication) {
    authService.resendVerificationEmail(authentication.getName());
    return ResponseEntity.noContent().build();
}


}
