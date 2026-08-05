package com.twinchainstudios.ourkanban.service.auth;

import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.messaging.Message;


@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtChannelInterceptor(
            JwtService jwtService,
            UserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader =
                    accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7);

                String username = jwtService.extractUsername(token);

                UserDetails user =
                        userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                user.getAuthorities());

                accessor.setUser(authentication);

                // Populate Spring Security context for the current thread so @MessageMapping handlers
                // that read SecurityContextHolder.getContext() will find the authentication.
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } else {
            // For non-CONNECT frames ensure the SecurityContextHolder contains the user from the message headers
            if (accessor.getUser() instanceof org.springframework.security.core.Authentication) {
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .setAuthentication((org.springframework.security.core.Authentication) accessor.getUser());
            }
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        // Clear the SecurityContext to avoid leaking authentication between threads
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
}