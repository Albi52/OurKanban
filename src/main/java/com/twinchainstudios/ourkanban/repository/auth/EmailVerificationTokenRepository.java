package com.twinchainstudios.ourkanban.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twinchainstudios.ourkanban.model.auth.EmailVerificationToken;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    void deleteByUser_Id(Long userId);
}