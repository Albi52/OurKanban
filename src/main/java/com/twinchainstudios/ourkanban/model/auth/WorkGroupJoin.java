package com.twinchainstudios.ourkanban.model.auth;

import java.time.LocalDateTime;

import com.twinchainstudios.ourkanban.model.domain.WorkGroup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(
    name = "group_join_requests",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {"user_id", "work_group_id"}
        )
    }
)
public class WorkGroupJoin {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User who is being invited
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Group the user is being invited to
    @ManyToOne(optional = false)
    @JoinColumn(name = "work_group_id", nullable = false)
    private WorkGroup workGroup;

    // User who sent the invitation
    @ManyToOne(optional = false)
    @JoinColumn(name = "invited_by_id", nullable = false)
    private User invitedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JoinRequestStatus status = JoinRequestStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;

   /* public WorkGroupJoin(Long id, User user, WorkGroup workGroup, User invitedBy, JoinRequestStatus status,
            LocalDateTime createdAt, LocalDateTime respondedAt) {
        this.id = id;
        this.user = user;
        this.workGroup = workGroup;
        this.invitedBy = invitedBy;
        this.status = status;
        this.createdAt = createdAt;
        this.respondedAt = respondedAt;
    }*/

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

    public WorkGroup getWorkGroup() {
        return workGroup;
    }

    public void setWorkGroup(WorkGroup workGroup) {
        this.workGroup = workGroup;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }

    public JoinRequestStatus getStatus() {
        return status;
    }

    public void setStatus(JoinRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
}
