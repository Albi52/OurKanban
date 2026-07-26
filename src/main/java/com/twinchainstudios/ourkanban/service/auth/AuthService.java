package com.twinchainstudios.ourkanban.service.auth;

import com.twinchainstudios.ourkanban.dto.auth.request.GoogleLoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.LoginRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.RegisterRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdatePasswordRequest;
import com.twinchainstudios.ourkanban.dto.auth.request.UpdateUsernameRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.AuthResponse;
import com.twinchainstudios.ourkanban.dto.auth.response.MeResponse;
import com.twinchainstudios.ourkanban.exception.*;
import com.twinchainstudios.ourkanban.model.auth.AuthProvider;
import com.twinchainstudios.ourkanban.model.auth.EmailVerificationToken;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.repository.auth.EmailVerificationTokenRepository;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
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
import org.springframework.web.multipart.MultipartFile;

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
    private final ImageStorageService imageStorageService;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailVerificationTokenRepository tokenRepository,
            EmailService emailService,
            ImageStorageService imageStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.imageStorageService = imageStorageService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Optional<User> existingByEmail = userRepository.findByEmail(request.email());

        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();

            if (existing.getProvider() == AuthProvider.LOCAL) {
                throw new AlreadyExistsException("Email is already registered");
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
            throw new AlreadyExistsException("Username is already taken. " + request.username());
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
                new UsernamePasswordAuthenticationToken(request.usernameOrEmail(), request.password()));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.isLocalCredentialsPending()) {
            throw new AuthenticationException(
                    "Please verify your email to finish setting up password login for this account.");
        }

        String token = jwtService.generateToken(authentication.getName());
        return new AuthResponse(token, null);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());

        Boolean googleEmailVerified = payload.getEmailVerified();
        if (googleEmailVerified == null || !googleEmailVerified) {
            throw new InvalidTokenException("Google account email is not verified");
        }

        String googleId = payload.getSubject();
        User user = userRepository.findByProviderId(googleId)
                .orElseGet(() -> linkOrCreateGoogleUser(payload));

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, null);
    }

    /**
     * Keeps a non-custom profile picture in sync with the user's current Google
     * picture. Only writes to the DB when the value actually changed, so a
     * returning user logging in repeatedly with an unchanged Google picture
     * causes zero extra writes.
     */
    private void syncGooglePictureIfNotCustom(User user, String googlePictureUrl) {
        if (user.isCustomProfilePicture()) {
            return;
        }
        if (googlePictureUrl == null) {
            return;
        }

        try {
            String localUrl = imageStorageService.storeFromUrl(googlePictureUrl, user.getId());
            if (!localUrl.equals(user.getProfilePicture())) {
                user.setProfilePicture(localUrl);
                userRepository.save(user);
            }
        } catch (Exception e) {
            // If Google's CDN is rate-limiting or briefly unreachable, don't
            // block login over an avatar sync failure — just skip this round,
            // the next login will retry.
            System.err.println("Failed to sync Google profile picture: " + e.getMessage());
        }
    }

    private User linkOrCreateGoogleUser(GoogleIdToken.Payload payload) {
        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String googlePictureUrl = (String) payload.get("picture");

        Optional<User> existingByEmail = userRepository.findByEmail(email);

        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();
            existing.setProviderId(googleId);

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
        userRepository.save(newUser);

        // First-time-only picture sync — this account has never had a chance
        // to set anything yet, so it's safe to grab Google's picture once here.
        // No sync happens on subsequent logins; the user can re-fetch it
        // explicitly later via the account settings button.
        if (googlePictureUrl != null) {
            try {
                String localUrl = imageStorageService.storeFromUrl(googlePictureUrl, newUser.getId());
                newUser.setProfilePicture(localUrl);
                userRepository.save(newUser);
            } catch (Exception e) {
                System.err.println("Failed to fetch initial Google profile picture: " + e.getMessage());
            }
        }

        return newUser;
    }

    @Transactional
    public void verifyEmail(String token) {
        Optional<EmailVerificationToken> maybeEvt = tokenRepository.findByToken(token);

        if (maybeEvt.isEmpty()) {
            // Either a bad token, or this link was already used successfully once.
            // We can't tell the difference from the token alone anymore since it's
            // deleted on success — that's fine, this is intentionally treated as
            // an error state rather than silently claiming success for a random token.
            throw new InvalidTokenException("Invalid verification link");
        }

        EmailVerificationToken evt = maybeEvt.get();

        if (evt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("This email verification link has expired");
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
            throw new InvalidTokenException("Your email is already verified");
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
                user.isLocalPasswordSet(),
                user.getProfilePicture(),
                user.getProviderId() != null);
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
                throw new InvalidTokenException("Invalid Google ID token");
            }
            return idToken.getPayload();

        } catch (GeneralSecurityException | IOException e) {
            throw new InvalidTokenException("Could not verify Google ID token");
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
            throw new AlreadyExistsException("Username is already taken. " + currentUsername);
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
                throw new AuthenticationException("Current password is incorrect");
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

    @Transactional
    public MeResponse updateProfilePicture(String username, MultipartFile file) {
        User user = getUserOrThrow(username);
        String url = imageStorageService.store(file, user.getId());
        user.setProfilePicture(url);
        user.setCustomProfilePicture(true); // user's deliberate choice — Google sync stops touching this
        userRepository.save(user);
        return getMe(username);
    }

    @Transactional
    public MeResponse removeProfilePicture(String username) {
        User user = getUserOrThrow(username);
        imageStorageService.delete(user.getId());
        user.setProfilePicture(null);
        user.setCustomProfilePicture(false); // back to auto-syncing from Google, if applicable
        userRepository.save(user);
        return getMe(username);
    }

   
    @Transactional
public MeResponse refreshGoogleProfilePicture(String username, GoogleLoginRequest request) {
    User user = getUserOrThrow(username);
    GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());

    Boolean googleEmailVerified = payload.getEmailVerified();
    if (googleEmailVerified == null || !googleEmailVerified) {
        throw new InvalidTokenException("Google account email is not verified");
    }

    String googleId = payload.getSubject();
    String googleEmail = payload.getEmail();

    if (user.getProviderId() == null) {
        // Never linked to Google before. Only proceed if this Google
        // account's verified email matches the local account's email —
        // that's the same proof of ownership we trust during normal
        // Google sign-in, just triggered from settings instead of login.
        if (!googleEmail.equalsIgnoreCase(user.getEmail())) {
            throw new InvalidTokenException(
                    "That Google account's email doesn't match your account email");
        }

        userRepository.findByProviderId(googleId).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new InvalidTokenException(
                        "That Google account is already linked to a different user");
            }
        });

        user.setProviderId(googleId);
        user.setEmailVerified(true);
        user.setLocalCredentialsPending(false);

    } else if (!payload.getSubject().equals(user.getProviderId())) {
        throw new InvalidTokenException("This Google account doesn't match your linked account");
    }

    String googlePictureUrl = (String) payload.get("picture");
    if (googlePictureUrl == null) {
        throw new InvalidTokenException("Google did not provide a profile picture");
    }

    String localUrl = imageStorageService.storeFromUrl(googlePictureUrl, user.getId());
    user.setProfilePicture(localUrl);
    user.setCustomProfilePicture(false);
    userRepository.save(user);

    return getMe(username);
}
}