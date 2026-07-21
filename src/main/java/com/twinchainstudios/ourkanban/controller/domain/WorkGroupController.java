package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.groups.AddMemberRequest;
import com.twinchainstudios.ourkanban.dto.domain.groups.CreateWorkGroupRequest;
import com.twinchainstudios.ourkanban.dto.domain.groups.WorkGroupResponse;
import com.twinchainstudios.ourkanban.service.domain.WorkGroupService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/workgroups")
public class WorkGroupController {

    private final WorkGroupService workGroupService;

    public WorkGroupController(WorkGroupService workGroupService) {
        this.workGroupService = workGroupService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<WorkGroupResponse>> getMyWorkGroups(Authentication authentication) {
        return ResponseEntity.ok(workGroupService.getWorkGroupsForUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<WorkGroupResponse> createWorkGroup(
            @RequestBody CreateWorkGroupRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(workGroupService.createWorkGroup(request, authentication.getName()));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leaveWorkGroup(@PathVariable Long id, Authentication authentication) {
        workGroupService.leaveWorkGroup(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{id}/members")
public ResponseEntity<WorkGroupResponse> addMember(
        @PathVariable Long id,
        @Valid @RequestBody AddMemberRequest request,
        Authentication authentication) {
    return ResponseEntity.ok(workGroupService.addMember(id, request, authentication.getName()));
}

@DeleteMapping("/{id}/members/{userId}")
public ResponseEntity<WorkGroupResponse> removeMember(
        @PathVariable Long id,
        @PathVariable Long userId,
        Authentication authentication) {
    return ResponseEntity.ok(workGroupService.removeMember(id, userId, authentication.getName()));
}
}