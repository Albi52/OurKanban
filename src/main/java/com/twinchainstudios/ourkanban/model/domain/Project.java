package com.twinchainstudios.ourkanban.model.domain;


import java.util.*;

import com.twinchainstudios.ourkanban.model.WorkGroup;

import jakarta.persistence.*;


@Entity
@Table(
    name = "projects",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "work_group_id",
                "name"
            }
        )
    }
)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "work_group_id")
    private WorkGroup workGroup;

    @OneToMany(
        mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<ProjectMember> members = new ArrayList<>();

    @OneToMany(
        mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(
        mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Event> events = new ArrayList<>();

    @OneToMany(
        mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(
        mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Role> roles = new ArrayList<>();

    @OneToMany(
    mappedBy = "project",
    cascade = CascadeType.ALL,
    orphanRemoval = true
)
private List<DashboardColumn> columns = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public WorkGroup getWorkGroup() {
        return workGroup;
    }

    public void setWorkGroup(WorkGroup workGroup) {
        this.workGroup = workGroup;
    }

    public List<ProjectMember> getMembers() {
        return members;
    }

    public void setMembers(List<ProjectMember> members) {
        this.members = members;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public List<Event> getEvents() {
        return events;
    }

    public void setEvents(List<Event> events) {
        this.events = events;
    }

    public List<Notification> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<Notification> notifications) {
        this.notifications = notifications;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }
    public List<DashboardColumn> getColumns() {
        return columns;
    }
    public void setColumns(List<DashboardColumn> columns) {
        this.columns = columns;
    }
    
}