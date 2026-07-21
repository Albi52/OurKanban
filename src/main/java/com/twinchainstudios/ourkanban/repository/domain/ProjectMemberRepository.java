package com.twinchainstudios.ourkanban.repository.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twinchainstudios.ourkanban.model.domain.ProjectMember;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
}