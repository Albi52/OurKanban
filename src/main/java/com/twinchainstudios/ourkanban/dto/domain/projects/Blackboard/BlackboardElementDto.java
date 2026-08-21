package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;

import com.twinchainstudios.ourkanban.model.domain.BlackboardElement;

public class BlackboardElementDto {
    public Long id;
    public int row;
    public int col;
    public int width;
    public int height;
    public String type;
    public String textContent;
    public String imageUrl;
    public Long creatorId;
    public String creatorName;
    public String creatorProfilePicture;
    public String createdAt;
    public Long version;

    public static BlackboardElementDto from(BlackboardElement e) {
        BlackboardElementDto dto = new BlackboardElementDto();
        dto.id = e.getId();
        dto.row = e.getRow();
        dto.col = e.getCol();
        dto.width = e.getWidth();
        dto.height = e.getHeight();
        dto.type = e.getType().name();
        dto.textContent = e.getTextContent();
        dto.imageUrl = e.getImageUrl();
        dto.creatorId = e.getCreator() != null ? e.getCreator().getId() : null;
        dto.creatorName = e.getCreator() != null ? e.getCreator().getDisplayName() : null;
        dto.creatorProfilePicture = e.getCreator() != null ? e.getCreator().getProfilePicture() : null;
        dto.createdAt = e.getCreatedAt() != null ? e.getCreatedAt().toString() : null;
        dto.version = e.getVersion();
        return dto;
    }
}