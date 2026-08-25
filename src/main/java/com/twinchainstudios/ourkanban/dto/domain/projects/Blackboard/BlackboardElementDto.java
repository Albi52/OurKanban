package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;

import com.twinchainstudios.ourkanban.model.domain.BlackboardElement;

public class BlackboardElementDto {
    public Long id;
    public Integer row;
    public Integer col;
    public int width;
    public int height;
    public String attachmentType;
    public String textContent;
    public String imageUrl;
    public String pdfUrl;
    public String pdfThumbnailUrl;
    public String pdfFileName;
    public String linkUrl;
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
        dto.attachmentType = e.getAttachmentType().name();
        dto.textContent = e.getTextContent();
        dto.imageUrl = e.getImageUrl();
        dto.pdfUrl = e.getPdfUrl();
        dto.pdfThumbnailUrl = e.getPdfThumbnailUrl();
        dto.pdfFileName = e.getPdfFileName();
        dto.linkUrl = e.getLinkUrl();
        dto.creatorId = e.getCreator() != null ? e.getCreator().getId() : null;
        dto.creatorName = e.getCreator() != null ? e.getCreator().getDisplayName() : null;
        dto.creatorProfilePicture = e.getCreator() != null ? e.getCreator().getProfilePicture() : null;
        dto.createdAt = e.getCreatedAt() != null ? e.getCreatedAt().toString() : null;
        dto.version = e.getVersion();
        return dto;
    }
}