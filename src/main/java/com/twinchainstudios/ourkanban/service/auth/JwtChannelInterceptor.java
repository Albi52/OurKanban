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
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;


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
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        System.out.println("Comando: " + accessor.getCommand());
        System.out.println("User antes = " + accessor.getUser());

        System.out.println(accessor.getCommand());

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
                                
                System.out.println(authentication.getClass().getName());           // después de crear authentication
                System.out.println(authentication.getPrincipal().getClass().getName());
                accessor.setLeaveMutable(true);
                accessor.setUser(authentication);
                
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("Username: " + username);
                System.out.println("UserDetails: " + user);
                System.out.println("Authentication: " + authentication);

                System.out.println("User después = " + accessor.getUser());
                
                System.out.println("Session Atributes = " + accessor.getSessionAttributes());
                System.out.println("Session Id = " + accessor.getSessionId());

            }else {
            // For non-CONNECT frames ensure the SecurityContextHolder contains the user from the message headers
                if (accessor.getUser() instanceof org.springframework.security.core.Authentication) {
                    org.springframework.security.core.context.SecurityContextHolder.getContext()
                            .setAuthentication((org.springframework.security.core.Authentication) accessor.getUser());
                }
            }

            System.out.println("Authorization = " + authHeader);
        }
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            System.out.println("Session Atributes = " + accessor.getSessionAttributes());
            System.out.println("Session Id = " + accessor.getSessionId());
        }

        return MessageBuilder.createMessage(
            message.getPayload(),
            accessor.getMessageHeaders()
        );
        
    }
}