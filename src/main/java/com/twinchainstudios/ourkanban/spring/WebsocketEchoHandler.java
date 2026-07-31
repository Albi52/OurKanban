package com.twinchainstudios.ourkanban.spring;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class WebsocketEchoHandler extends TextWebSocketHandler{   
    private Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();    

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        
    }

    
    public void sendMessageToOne(WebSocketSession session, String payload) {
        try {
            session.sendMessage(new TextMessage(payload));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendMessageToOther(WebSocketSession session, String payload) {
        for (WebSocketSession sessionAct : sessions.values()) {
            try {
                if (!sessionAct.getId().equals(session.getId())){
                    sessionAct.sendMessage(new TextMessage(payload));
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public void sendMessageToAll(String payload) {
        for (WebSocketSession sessionAct : sessions.values()) {
            try {
                sessionAct.sendMessage(new TextMessage(payload));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
