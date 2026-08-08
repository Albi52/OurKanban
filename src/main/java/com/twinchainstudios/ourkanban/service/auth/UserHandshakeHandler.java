package com.twinchainstudios.ourkanban.service.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.http.server.ServerHttpRequest;

import java.security.Principal;
import java.util.Map;

import org.springframework.security.core.Authentication;

@Component
public class UserHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, org.springframework.web.socket.WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Object p = attributes.get("principal");
        if (p instanceof Principal) {
            return (Principal) p;
        }
        if (p instanceof Authentication) {
            return (Authentication) p;
        }
        // Fallback to default behaviour
        return super.determineUser(request, wsHandler, attributes);
    }
}
