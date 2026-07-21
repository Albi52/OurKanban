package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.groups.ProjectCapsuleResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.CreateProjectRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.UpdateProjectRequest;
import com.twinchainstudios.ourkanban.service.domain.ProjectService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/workgroups/{workGroupId}/projects")
    public ResponseEntity<ProjectCapsuleResponse> createProject(
            @PathVariable Long workGroupId,
            @Valid@RequestBody CreateProjectRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                projectService.createProject(workGroupId, request, authentication.getName()));
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long projectId,
            Authentication authentication) {
        projectService.deleteProject(projectId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/projects/{projectId}")
public ResponseEntity<ProjectCapsuleResponse> renameProject(
        @PathVariable Long projectId,
        @Valid @RequestBody UpdateProjectRequest request,
        Authentication authentication) {
    return ResponseEntity.ok(
            projectService.renameProject(projectId, request, authentication.getName()));
}
    @GetMapping("/projects/{projectId}")
public ResponseEntity<ProjectCapsuleResponse> getProject(
        @PathVariable Long projectId,
        Authentication authentication) {
    return ResponseEntity.ok(projectService.getProject(projectId, authentication.getName()));
}
}