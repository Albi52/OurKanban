package com.twinchainstudios.ourkanban.service.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.HandshakeHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.net.URI;
import java.security.Principal;
import java.util.Map;
import java.util.List;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtHandshakeInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   org.springframework.web.socket.WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

        HttpHeaders headers = request.getHeaders();
        String authHeader = headers.getFirst("Authorization");

        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            // Try query param e.g. /ws?token=...
            URI uri = request.getURI();
            if (uri != null && uri.getQuery() != null) {
                String[] parts = uri.getQuery().split("&");
                for (String p : parts) {
                    if (p.startsWith("token=")) {
                        token = p.substring("token=".length());
                        break;
                    }
                }
            }
        }

        if (token != null) {
            try {
                String username = jwtService.extractUsername(token);
                UserDetails user = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                // Store the Authentication in attributes so the HandshakeHandler can set it as the session Principal
                attributes.put("principal", authentication);
            } catch (Exception e) {
                // token invalid or user not found -> ignore and allow handshake to continue unauthenticated
                System.out.println("JwtHandshakeInterceptor: token invalid or user not found: " + e.getMessage());
            }
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               org.springframework.web.socket.WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}