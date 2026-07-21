package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.dto.domain.groups.ProjectCapsuleResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.CreateProjectRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.UpdateProjectRequest;
import com.twinchainstudios.ourkanban.exception.*;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.WorkGroup;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectRepository;
import com.twinchainstudios.ourkanban.repository.domain.WorkGroupRepository;
import com.twinchainstudios.ourkanban.repository.domain.DashboardColumnRepository;
import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkGroupRepository workGroupRepository;
    private final UserRepository userRepository;
    private final ProjectMemberService projectMemberService;
    private final DashboardColumnRepository dashboardColumnRepository;

    public ProjectService(ProjectRepository projectRepository,
                           WorkGroupRepository workGroupRepository,
                           UserRepository userRepository,
                           ProjectMemberService projectMemberService,
                           DashboardColumnRepository dashboardColumnRepository) {
        this.projectRepository = projectRepository;
        this.workGroupRepository = workGroupRepository;
        this.userRepository = userRepository;
        this.projectMemberService = projectMemberService;
        this.dashboardColumnRepository = dashboardColumnRepository;
    }



@Transactional
public ProjectCapsuleResponse createProject(Long workGroupId, CreateProjectRequest request, String username) {
    User user = getUserOrThrow(username);
    WorkGroup workGroup = workGroupRepository.findById(workGroupId)
            .orElseThrow(() -> new NotFoundException("Group not found."));

    requireLeader(workGroup, user);

    Project project = new Project();
    project.setName(request.name());
    project.setWorkGroup(workGroup);

    try {
        projectRepository.save(project);
    } catch (DataIntegrityViolationException e) {
        throw new ConflictException("A project with that name already exists in this group");
    }

    createDefaultColumns(project);
    projectMemberService.createDefaultMembers(project, workGroup.getUsers()); // ← new line

    return new ProjectCapsuleResponse(project.getId(), project.getName(), workGroup.getId(), true);
}

    @Transactional
    public void deleteProject(Long projectId, String username) {
        User user = getUserOrThrow(username);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        requireLeader(project.getWorkGroup(), user);

        projectRepository.delete(project);
    }
    @Transactional
public ProjectCapsuleResponse renameProject(Long projectId, UpdateProjectRequest request, String username) {
    User user = getUserOrThrow(username);
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new NotFoundException("Project not found"));

    requireLeader(project.getWorkGroup(), user);

    project.setName(request.name());

    try {
        projectRepository.save(project);
    } catch (DataIntegrityViolationException e) {
        throw new ConflictException(
                "A project with that name already exists in this group");
    }

    return new ProjectCapsuleResponse(project.getId(), project.getName(), project.getWorkGroup().getId(), true);
}

    private void requireLeader(WorkGroup workGroup, User user) {
        if (!workGroup.getLeader().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Only the group leader can do this");
        }
    }

    private User getUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public Project getProjectAndVerifyMembership(Long projectId, String username) {
    User user = getUserOrThrow(username);
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new NotFoundException("Project not found"));

    boolean isMember = project.getWorkGroup().getUsers().stream()
            .anyMatch(u -> u.getId().equals(user.getId()));

    if (!isMember) {
        throw new ForbiddenOperationException("You are not a member of this project's group");
    }

    return project;
}

@Transactional(readOnly = true)
public ProjectCapsuleResponse getProject(Long projectId, String username) {
    Project project = getProjectAndVerifyMembership(projectId, username);
    return new ProjectCapsuleResponse(project.getId(), project.getName(), project.getWorkGroup().getId(), true);

}
private void createDefaultColumns(Project project) {
    String[] defaults = { "TODO", "IN PROGRESS", "DONE" };
    for (int i = 0; i < defaults.length; i++) {
        DashboardColumn column = new DashboardColumn();
        column.setName(defaults[i]);
        column.setPosition(i);
        column.setProject(project);
        dashboardColumnRepository.save(column);
    }
}
}