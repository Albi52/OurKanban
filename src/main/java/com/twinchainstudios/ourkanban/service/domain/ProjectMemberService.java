package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.ProjectMemberResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.UpdateDisplayNameRequest;
import com.twinchainstudios.ourkanban.exception.NotAMemberException;
import com.twinchainstudios.ourkanban.exception.ProjectMemberNotFoundException;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;
import com.twinchainstudios.ourkanban.model.domain.WorkGroup;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectMemberRepository;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Keeps ProjectMember rows in sync with WorkGroup membership.
 *
 * ProjectMember = a user's identity WITHIN one specific project (what
 * Task.assignee/author point to, and what a per-project display name
 * lives on) — distinct from User, which is account-wide identity.
 *
 * Scope of this service, deliberately: creating/reading/renaming
 * ProjectMember rows only. It does not touch Task, Column, or Role —
 * that's for whoever builds the board/task features.
 */
@Service
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectMemberService(ProjectMemberRepository projectMemberRepository,
                                 UserRepository userRepository) {
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    /** Called right after a Project is created — gives every current WorkGroup user a ProjectMember row on it. */
    @Transactional
    public void createDefaultMembers(Project project, Set<User> workGroupUsers) {
        for (User user : workGroupUsers) {
            createIfMissing(project, user);
        }
    }

    /** Called right after a user is added to a WorkGroup — gives them a ProjectMember row on every project that group already has. */
    @Transactional
    public void addUserToAllProjects(WorkGroup workGroup, User user) {
        for (Project project : workGroup.getProjects()) {
            createIfMissing(project, user);
        }
    }

    private void createIfMissing(Project project, User user) {
        if (projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            return;
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setDisplayName(user.getUsername());
        projectMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getMembers(Long projectId) {
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse updateDisplayName(Long projectId, Long memberId,
                                                     UpdateDisplayNameRequest request,
                                                     String username) {
        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ProjectMember member = projectMemberRepository.findById(memberId)
                .filter(m -> m.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ProjectMemberNotFoundException("Project member not found"));

        // Only the member themself can rename their own display name for now.
        // Whether leaders should be able to rename OTHERS is left open —
        // easy to loosen this single check later if that's wanted.
        if (!member.getUser().getId().equals(requester.getId())) {
            throw new NotAMemberException("You can only rename your own display name");
        }

        member.setDisplayName(request.displayName());
        projectMemberRepository.save(member);
        return toResponse(member);
    }

    private ProjectMemberResponse toResponse(ProjectMember member) {
        return new ProjectMemberResponse(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getDisplayName()
        );
    }
}