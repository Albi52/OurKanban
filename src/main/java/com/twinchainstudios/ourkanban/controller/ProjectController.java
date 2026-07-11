package com.twinchainstudios.ourkanban.controller;

import com.twinchainstudios.ourkanban.dto.application.request.CreateProjectRequest;
import com.twinchainstudios.ourkanban.dto.application.request.UpdateProjectRequest;
import com.twinchainstudios.ourkanban.dto.application.response.ProjectResponse;
import com.twinchainstudios.ourkanban.service.ProjectService;
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
    public ResponseEntity<ProjectResponse> createProject(
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
public ResponseEntity<ProjectResponse> renameProject(
        @PathVariable Long projectId,
        @Valid @RequestBody UpdateProjectRequest request,
        Authentication authentication) {
    return ResponseEntity.ok(
            projectService.renameProject(projectId, request, authentication.getName()));
}
    @GetMapping("/projects/{projectId}")
public ResponseEntity<ProjectResponse> getProject(
        @PathVariable Long projectId,
        Authentication authentication) {
    return ResponseEntity.ok(projectService.getProject(projectId, authentication.getName()));
}
}