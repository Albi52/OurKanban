package com.twinchainstudios.ourkanban.model;


import java.time.LocalDate;


import jakarta.persistence.*;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
@ManyToOne
@JoinColumn(name = "column_id")
private DashboardColumn column;

    private LocalDate startDate;

    private LocalDate endDate;

    @ManyToOne
    @JoinColumn(name = "assignee_id")
    private ProjectMember assignee;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private ProjectMember author;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public DashboardColumn getColumn() {
        return column;
    }

    public void setColumn(DashboardColumn column) {
        this.column = column;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public ProjectMember getAssignee() {
        return assignee;
    }

    public void setAssignee(ProjectMember assignee) {
        this.assignee = assignee;
    }

    public ProjectMember getAuthor() {
        return author;
    }

    public void setAuthor(ProjectMember author) {
        this.author = author;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }
}
