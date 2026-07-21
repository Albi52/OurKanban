package com.twinchainstudios.ourkanban.service.auth;

import com.twinchainstudios.ourkanban.dto.auth.UserPrincipal;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with username or email: " + usernameOrEmail));

        return new UserPrincipal(user);
    }
}