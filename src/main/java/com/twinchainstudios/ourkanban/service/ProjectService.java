package com.twinchainstudios.ourkanban.service;

import com.twinchainstudios.ourkanban.dto.application.request.CreateProjectRequest;
import com.twinchainstudios.ourkanban.dto.application.request.UpdateProjectRequest;
import com.twinchainstudios.ourkanban.dto.application.response.ProjectResponse;
import com.twinchainstudios.ourkanban.exception.DuplicateProjectNameException;
import com.twinchainstudios.ourkanban.exception.NotAMemberException;
import com.twinchainstudios.ourkanban.exception.NotLeaderException;
import com.twinchainstudios.ourkanban.exception.ProjectNotFoundException;
import com.twinchainstudios.ourkanban.exception.WorkGroupNotFoundException;
import com.twinchainstudios.ourkanban.model.Project;
import com.twinchainstudios.ourkanban.model.User;
import com.twinchainstudios.ourkanban.model.WorkGroup;
import com.twinchainstudios.ourkanban.repository.ProjectRepository;
import com.twinchainstudios.ourkanban.repository.UserRepository;
import com.twinchainstudios.ourkanban.repository.WorkGroupRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkGroupRepository workGroupRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                           WorkGroupRepository workGroupRepository,
                           UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.workGroupRepository = workGroupRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProjectResponse createProject(Long workGroupId, CreateProjectRequest request, String username) {
        User user = getUserOrThrow(username);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new WorkGroupNotFoundException("Group not found"));

        requireLeader(workGroup, user);

        Project project = new Project();
        project.setName(request.name());
        project.setWorkGroup(workGroup);

        try {
            projectRepository.save(project);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateProjectNameException(
                    "A project with that name already exists in this group");
        }

        return new ProjectResponse(project.getId(), project.getName(), project.getWorkGroup().getId(), true);
    }

    @Transactional
    public void deleteProject(Long projectId, String username) {
        User user = getUserOrThrow(username);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        requireLeader(project.getWorkGroup(), user);

        projectRepository.delete(project);
    }
    @Transactional
public ProjectResponse renameProject(Long projectId, UpdateProjectRequest request, String username) {
    User user = getUserOrThrow(username);
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

    requireLeader(project.getWorkGroup(), user);

    project.setName(request.name());

    try {
        projectRepository.save(project);
    } catch (DataIntegrityViolationException e) {
        throw new DuplicateProjectNameException(
                "A project with that name already exists in this group");
    }

    return new ProjectResponse(project.getId(), project.getName(), project.getWorkGroup().getId(), true);
}

    private void requireLeader(WorkGroup workGroup, User user) {
        if (!workGroup.getLeader().getId().equals(user.getId())) {
            throw new NotLeaderException("Only the group leader can do this");
        }
    }

    private User getUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public Project getProjectAndVerifyMembership(Long projectId, String username) {
    User user = getUserOrThrow(username);
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

    boolean isMember = project.getWorkGroup().getUsers().stream()
            .anyMatch(u -> u.getId().equals(user.getId()));

    if (!isMember) {
        throw new NotAMemberException("You are not a member of this project's group");
    }

    return project;
}

@Transactional(readOnly = true)
public ProjectResponse getProject(Long projectId, String username) {
    Project project = getProjectAndVerifyMembership(projectId, username);
    return new ProjectResponse(project.getId(), project.getName(), project.getWorkGroup().getId(), true);

}
}