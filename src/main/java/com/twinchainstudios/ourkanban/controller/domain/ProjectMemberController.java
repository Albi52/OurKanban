package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.ProjectMemberResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.UpdateDisplayNameRequest;
import com.twinchainstudios.ourkanban.service.domain.ProjectMemberService;
import com.twinchainstudios.ourkanban.service.domain.ProjectService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/members")
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;
    private final ProjectService projectService;

    public ProjectMemberController(ProjectMemberService projectMemberService, ProjectService projectService) {
        this.projectMemberService = projectMemberService;
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectMemberResponse>> getMembers(
            @PathVariable Long projectId,
            Authentication authentication) {
        projectService.getProjectAndVerifyMembership(projectId, authentication.getName());
        return ResponseEntity.ok(projectMemberService.getMembers(projectId));
    }

    @PatchMapping("/{memberId}/display-name")
    public ResponseEntity<ProjectMemberResponse> updateDisplayName(
            @PathVariable Long projectId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateDisplayNameRequest request,
            Authentication authentication) {
        projectService.getProjectAndVerifyMembership(projectId, authentication.getName());
        return ResponseEntity.ok(
                projectMemberService.updateDisplayName(projectId, memberId, request, authentication.getName()));
    }
}