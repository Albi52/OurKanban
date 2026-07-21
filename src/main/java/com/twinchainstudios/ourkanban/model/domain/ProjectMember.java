package com.twinchainstudios.ourkanban.model.domain;

import java.util.*;

import com.twinchainstudios.ourkanban.model.auth.User;

import jakarta.persistence.*;

@Entity
@Table(
    name = "project_members",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "user_id",
                "project_id"
            }
        )
    }
)
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    private String displayName;

    @ManyToMany
    @JoinTable(
        name = "project_member_roles",
        joinColumns = @JoinColumn(name = "project_member_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
}