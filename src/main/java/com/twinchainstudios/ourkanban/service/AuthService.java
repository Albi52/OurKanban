package com.twinchainstudios.ourkanban.service;

import com.twinchainstudios.ourkanban.dto.auth.request.GoogleLoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.AuthResponse;
import com.twinchainstudios.ourkanban.model.User;
import com.twinchainstudios.ourkanban.exception.UserAlreadyExistsException;
import com.twinchainstudios.ourkanban.model.enums.AuthProvider;
import com.twinchainstudios.ourkanban.repository.UserRepository;
import com.twinchainstudios.ourkanban.security.JwtService;
import com.twinchainstudios.ourkanban.exception.*;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Value;

import java.security.GeneralSecurityException;
import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    @Value("${google.client-id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UserAlreadyExistsException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setProvider(AuthProvider.LOCAL);

        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.usernameOrEmail(),
                        request.password()
                )
        );

        String token = jwtService.generateToken(authentication.getName());
        return new AuthResponse(token);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
    GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());

    String email = payload.getEmail();
    String googleId = payload.getSubject();

    User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setUsername(generateUsernameFromEmail(email));
                newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                newUser.setProvider(AuthProvider.GOOGLE);
                newUser.setProviderId(googleId);
                return userRepository.save(newUser);
            });

    String token = jwtService.generateToken(user.getUsername());
    return new AuthResponse(token);
}

private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
    try {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) {
            throw new InvalidGoogleTokenException("Invalid Google ID token");
        }
        return idToken.getPayload();

    } catch (GeneralSecurityException | IOException e) {
        throw new InvalidGoogleTokenException("Could not verify Google ID token");
    }
}

private String generateUsernameFromEmail(String email) {
    String base = email.split("@")[0];
    String candidate = base;
    int suffix = 1;
    while (userRepository.existsByUsername(candidate)) {
        candidate = base + suffix++;
    }
    return candidate;
}
}