package com.twinchainstudios.ourkanban.dto.domain.websockets;

public class BoardMessage {
    public BoardMessageType type;
    public Object data;

    public BoardMessage() {
    }

    public BoardMessage(BoardMessageType type, Object data) {
        this.type = type;
        this.data = data;
    }
}
