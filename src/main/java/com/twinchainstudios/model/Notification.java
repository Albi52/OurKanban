package com.twinchainstudios.model;

import java.time.LocalDateTime;
import java.util.*;

import jakarta.persistence.*;
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private ProjectMember author;

    @Column(length = 5000)
    private String text;

    @ManyToMany
    @JoinTable(
        name = "notification_recipient_roles",
        joinColumns = @JoinColumn(name = "notification_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> recipientRoles = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    private LocalDateTime date;

    public Notification() {
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public ProjectMember getAuthor() {
        return author;
    }
    public void setAuthor(ProjectMember author) {
        this.author = author;
    }
    public String getText() {
        return text;
    }
    public void setText(String text) {
        this.text = text;
    }
    public Set<Role> getRecipientRoles() {
        return recipientRoles;
    }
    public void setRecipientRoles(Set<Role> recipientRoles) {
        this.recipientRoles = recipientRoles;
    }
    public Project getProject() {
        return project;
    }
    public void setProject(Project project) {
        this.project = project;
    }
    public LocalDateTime getDate() {
        return date;
    }
    public void setDate(LocalDateTime date) {
        this.date = date;
    }
    
}