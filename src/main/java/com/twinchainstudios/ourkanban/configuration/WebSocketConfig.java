package com.twinchainstudios.ourkanban.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

import com.twinchainstudios.ourkanban.service.auth.JwtChannelInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtChannelInterceptor jwtChannelInterceptor;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final UserHandshakeHandler userHandshakeHandler;

    public WebSocketConfig(JwtChannelInterceptor jwtChannelInterceptor, JwtHandshakeInterceptor jwtHandshakeInterceptor, UserHandshakeHandler userHandshakeHandler) {
        this.jwtChannelInterceptor = jwtChannelInterceptor;
        this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
        this.userHandshakeHandler = userHandshakeHandler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "*") // Permite la conexión desde Vite
                .setHandshakeHandler(userHandshakeHandler)
                .addInterceptors(jwtHandshakeInterceptor)
                .withSockJS();
    }
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
    
}