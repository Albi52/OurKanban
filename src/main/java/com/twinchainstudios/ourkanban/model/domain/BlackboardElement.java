package com.twinchainstudios.ourkanban.model.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blackboard_elements")
public class BlackboardElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "blackboard_id")
    private Blackboard blackboard;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private ProjectMember creator;



    @Enumerated(EnumType.STRING) //Deprecated, use attachmentType instead
    @Column(name="type")
    private ElementType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachmentType", columnDefinition = "VARCHAR(255)")
    private AttachmentType attachmentType;

   // Top-left corner, absolute grid coordinates (can be negative once the
   // board has grown up/left from its original origin). Null means the
   // element is sitting in the shelf, not placed on the grid — size
   // (width/height) is still required and preserved either way.
   @Column(name = "grid_row")
   private Integer row;
   @Column(name = "grid_col")
   private Integer col;
    // Size in grid cells. Both must be >= 1.
    private int width;
    private int height;

    @Column(length = 2000)
    private String textContent;

    @Column(length = 500)
    private String imageUrl;

    
    @Column(length = 500)
    private String pdfUrl;             // the stored PDF file itself

    @Column(length = 500)
    private String pdfThumbnailUrl;    // generated first-page thumbnail JPEG

    @Column(length = 255)
    private String pdfFileName;        // original uploaded filename, for nicer downloads

    @Column(length = 2000)
    private String linkUrl;            // raw URL for LINK elements

    private Instant createdAt = Instant.now();

    // Optimistic locking — same pattern as the tasks table, useful here since
    // multiple members can drag/resize concurrently.
    @Version
    private Long version;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Blackboard getBlackboard() {
        return blackboard;
    }

    public void setBlackboard(Blackboard blackboard) {
        this.blackboard = blackboard;
    }

    public ProjectMember getCreator() {
        return creator;
    }

    public void setCreator(ProjectMember creator) {
        this.creator = creator;
    }

    public AttachmentType getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(AttachmentType attachmentType) {
        this.attachmentType = attachmentType;
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public Integer getCol() {
        return col;
    }

    public void setCol(Integer col) {
        this.col = col;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public String getPdfThumbnailUrl() {
        return pdfThumbnailUrl;
    }

    public void setPdfThumbnailUrl(String pdfThumbnailUrl) {
        this.pdfThumbnailUrl = pdfThumbnailUrl;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }
        public ElementType getType() {
        return type;
    }

    public void setType(ElementType type) {
        this.type = type;
    }
}