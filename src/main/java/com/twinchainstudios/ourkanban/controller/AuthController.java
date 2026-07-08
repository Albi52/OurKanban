package com.twinchainstudios.ourkanban.controller;


import com.twinchainstudios.ourkanban.dto.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.response.AuthResponse;
import com.twinchainstudios.ourkanban.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
