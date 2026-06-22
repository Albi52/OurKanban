package com.twinchainstudios.ourkanban;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.twinchainstudios.ourkanban.spring.WebsocketEchoHandler;

@SpringBootApplication
@EnableWebSocket
public class OurkanbanApplication implements WebSocketConfigurer {

	public static void main(String[] args) {
		SpringApplication.run(OurkanbanApplication.class, args);
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(echoHandler(), "/echo").setAllowedOrigins("*");
	}   

    @Bean
    public WebsocketEchoHandler echoHandler() {
        return new WebsocketEchoHandler();
    }

}
