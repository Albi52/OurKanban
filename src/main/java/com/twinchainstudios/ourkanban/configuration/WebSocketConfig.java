package com.twinchainstudios.ourkanban.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import com.twinchainstudios.ourkanban.spring.WebsocketEchoHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(echoHandler(), "/echo")
                .setAllowedOrigins("*");
    }

    @Bean
    public WebsocketEchoHandler echoHandler() {
        return new WebsocketEchoHandler();
    }
}