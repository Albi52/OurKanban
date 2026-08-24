package com.twinchainstudios.ourkanban.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.twinchainstudios.ourkanban.service.auth.JwtChannelInterceptor;
import com.twinchainstudios.ourkanban.service.auth.JwtHandshakeInterceptor;
import com.twinchainstudios.ourkanban.service.auth.UserHandshakeHandler;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final UserHandshakeHandler userHandshakeHandler;
    private JwtChannelInterceptor jwtChannelInterceptor;

    public WebSocketConfig(
            JwtChannelInterceptor jwtChannelInterceptor,
            JwtHandshakeInterceptor jwtHandshakeInterceptor,
            UserHandshakeHandler userHandshakeHandler) {

        this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
        this.userHandshakeHandler = userHandshakeHandler;
        this.jwtChannelInterceptor = jwtChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173",
                    "${app.frontend-url}",
                    "${app.frontend-url-www}"
                )
                .addInterceptors(jwtHandshakeInterceptor)
                .setHandshakeHandler(userHandshakeHandler)
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