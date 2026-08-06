package com.twinchainstudios.ourkanban.controller.auth;

import com.twinchainstudios.ourkanban.dto.auth.request.GoogleLoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdatePasswordRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdateUsernameRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.AuthResponse;
import com.twinchainstudios.ourkanban.dto.auth.response.MeResponse;
import com.twinchainstudios.ourkanban.service.auth.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    @PatchMapping("/username")
    public ResponseEntity<AuthResponse> updateUsername(
            @Valid @RequestBody UpdateUsernameRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(authService.updateUsername(authentication.getName(), request));
    }

    @PatchMapping("/password")
    public ResponseEntity<AuthResponse> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(authService.updatePassword(authentication.getName(), request));
    }

    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MeResponse> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return ResponseEntity.ok(authService.updateProfilePicture(authentication.getName(), file));
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<MeResponse> removeProfilePicture(Authentication authentication) {
        return ResponseEntity.ok(authService.removeProfilePicture(authentication.getName()));
    }

    @PostMapping("/profile-picture/from-google")
    public ResponseEntity<MeResponse> refreshGoogleProfilePicture(
            @Valid @RequestBody GoogleLoginRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(authService.refreshGoogleProfilePicture(authentication.getName(), request));
    }
}
