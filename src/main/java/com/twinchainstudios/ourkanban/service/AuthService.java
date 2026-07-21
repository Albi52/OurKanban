package com.twinchainstudios.ourkanban.service;

import com.twinchainstudios.ourkanban.dto.auth.request.GoogleLoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdatePasswordRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdateUsernameRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.AuthResponse;
import com.twinchainstudios.ourkanban.dto.auth.response.MeResponse;
import com.twinchainstudios.ourkanban.exception.*;
import com.twinchainstudios.ourkanban.model.EmailVerificationToken;
import com.twinchainstudios.ourkanban.model.User;
import com.twinchainstudios.ourkanban.model.enums.AuthProvider;
import com.twinchainstudios.ourkanban.repository.EmailVerificationTokenRepository;
import com.twinchainstudios.ourkanban.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        EmailVerificationTokenRepository tokenRepository,
                        EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Optional<User> existingByEmail = userRepository.findByEmail(request.email());

        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();

            if (existing.getProvider() == AuthProvider.LOCAL) {
                throw new UserAlreadyExistsException("Email is already registered");
            }

            // Existing account originated via Google. Owning a Google session doesn't
            // prove whoever submitted THIS form controls the mailbox, so password
            // login stays locked until they re-verify via email.
            existing.setPassword(passwordEncoder.encode(request.password()));
            existing.setLocalCredentialsPending(true);
            existing.setLocalPasswordSet(true); 
            userRepository.save(existing);

            String token = createVerificationToken(existing);
            trySendVerificationEmail(existing.getEmail(), token);

            return new AuthResponse(null,
                    "This email is already linked to a Google account (username: " +
                    existing.getUsername() + "). We've sent a verification email — " +
                    "confirm it to enable password login for that account.");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new UserAlreadyExistsException("Username is already taken");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        user.setLocalCredentialsPending(false);
        user.setLocalPasswordSet(true);
        userRepository.save(user);

        String token = createVerificationToken(user);
        trySendVerificationEmail(user.getEmail(), token);

        String jwt = jwtService.generateToken(user.getUsername());
        return new AuthResponse(jwt, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.usernameOrEmail(), request.password())
        );

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.isLocalCredentialsPending()) {
            throw new EmailNotVerifiedException(
                    "Please verify your email to finish setting up password login for this account.");
        }

        String token = jwtService.generateToken(authentication.getName());
        return new AuthResponse(token, null);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());

        String email = payload.getEmail();
        String googleId = payload.getSubject();
        Boolean googleEmailVerified = payload.getEmailVerified();

        if (googleEmailVerified == null || !googleEmailVerified) {
            throw new InvalidGoogleTokenException("Google account email is not verified");
        }

        User user = userRepository.findByProviderId(googleId)
                .orElseGet(() -> linkOrCreateGoogleUser(email, googleId));

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, null);
    }

   private User linkOrCreateGoogleUser(String email, String googleId) {
    Optional<User> existingByEmail = userRepository.findByEmail(email);

    if (existingByEmail.isPresent()) {
        User existing = existingByEmail.get();
        existing.setProviderId(googleId);

        // If the local side of this account was never verified, we still let
        // Google in immediately (Google itself proved ownership right now) —
        // but we can't retroactively vouch for whoever set the local password
        // earlier, so that path gets walled off until they prove it via email too.
        if (!existing.isEmailVerified()) {
            existing.setLocalCredentialsPending(true);
        }

        return userRepository.save(existing);
    }

    User newUser = new User();
    newUser.setEmail(email);
    newUser.setUsername(generateUsernameFromEmail(email));
    newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
    newUser.setProvider(AuthProvider.GOOGLE);
    newUser.setProviderId(googleId);
    newUser.setEmailVerified(true);
    newUser.setLocalCredentialsPending(false);
    return userRepository.save(newUser);
}

    @Transactional
public void verifyEmail(String token) {
    Optional<EmailVerificationToken> maybeEvt = tokenRepository.findByToken(token);

    if (maybeEvt.isEmpty()) {
        // Either a bad token, or this link was already used successfully once.
        // We can't tell the difference from the token alone anymore since it's
        // deleted on success — that's fine, this is intentionally treated as
        // an error state rather than silently claiming success for a random token.
        throw new InvalidVerificationTokenException("Invalid verification link");
    }

    EmailVerificationToken evt = maybeEvt.get();

    if (evt.getExpiresAt().isBefore(LocalDateTime.now())) {
        throw new InvalidVerificationTokenException("This verification link has expired");
    }

    User user = evt.getUser();
    user.setEmailVerified(true);
    user.setLocalCredentialsPending(false);
    userRepository.save(user);
    tokenRepository.deleteByUser_Id(user.getId());
}

    @Transactional
    public void resendVerificationEmail(String username) {
        User user = getUserOrThrow(username);

        if (user.isEmailVerified() && !user.isLocalCredentialsPending()) {
            throw new InvalidVerificationTokenException("Your email is already verified");
        }

        tokenRepository.deleteByUser_Id(user.getId());
        String token = createVerificationToken(user);
        trySendVerificationEmail(user.getEmail(), token);
    }

    @Transactional(readOnly = true)
public MeResponse getMe(String username) {
    User user = getUserOrThrow(username);
    return new MeResponse(
            user.getUsername(),
            user.isEmailVerified(),
            user.isLocalCredentialsPending(),
            user.isLocalPasswordSet()
    );
}

    private String createVerificationToken(User user) {
        tokenRepository.deleteByUser_Id(user.getId());
        String token = UUID.randomUUID().toString();
        EmailVerificationToken evt = new EmailVerificationToken();
        evt.setToken(token);
        evt.setUser(user);
        evt.setExpiresAt(LocalDateTime.now().plusHours(24));
        tokenRepository.save(evt);
        return token;
    }

    private void trySendVerificationEmail(String email, String token) {
        try {
            emailService.sendVerificationEmail(email, token);
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
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

    private User getUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
    @Transactional
public AuthResponse updateUsername(String currentUsername, UpdateUsernameRequest request) {
    User user = getUserOrThrow(currentUsername);

    if (!request.newUsername().equals(currentUsername)
            && userRepository.existsByUsername(request.newUsername())) {
        throw new UserAlreadyExistsException("Username is already taken");
    }

    user.setUsername(request.newUsername());
    userRepository.save(user);

    // The JWT subject is the username, so anything signed under the old
    // name is now stale — issue a fresh token under the new one.
    String token = jwtService.generateToken(user.getUsername());
    return new AuthResponse(token, null);
}

@Transactional
public AuthResponse updatePassword(String username, UpdatePasswordRequest request) {
    User user = getUserOrThrow(username);

    if (user.isLocalPasswordSet()) {
        // Changing an existing password — require proof they still know the old one.
        if (request.currentPassword() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidCurrentPasswordException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, "Password updated");
    }

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    user.setLocalPasswordSet(true);
    user.setLocalCredentialsPending(false);
    userRepository.save(user);


    String token = jwtService.generateToken(user.getUsername());
    return new AuthResponse(token,
            "Password set. You can now log in with your username and password, or continue using Google login.");
}
}