package com.twinchainstudios.ourkanban.controller.auth;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.twinchainstudios.ourkanban.dto.auth.request.WorkGroupJoinRequest;
import com.twinchainstudios.ourkanban.dto.auth.response.UserSearchResult;
import com.twinchainstudios.ourkanban.dto.auth.response.WorkGroupJoinResponse;
import com.twinchainstudios.ourkanban.service.auth.user.WorkGroupJoinService;

import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/join")
public class WorkGroupJoinController {
    private final WorkGroupJoinService workGroupJoinService;

    public WorkGroupJoinController(WorkGroupJoinService workGroupJoinService) {
        this.workGroupJoinService = workGroupJoinService;
    }
    @GetMapping("/mine")
    public ResponseEntity<List<WorkGroupJoinResponse>> getMyPendingJoinRequests(Authentication authentication) {
        return ResponseEntity.ok(workGroupJoinService.getPendingJoinRequestsForUser(authentication.getName()));
    }
    ///The ones pending in a group, for the leader to see and cancel.
    @GetMapping("/{workGroupId}")
    public ResponseEntity<List<UserSearchResult>> getPendingJoinRequestOfGroup(@PathVariable Long workGroupId, Authentication authentication) {
        return ResponseEntity.ok(workGroupJoinService.getPendingJoinRequestOfGroup(workGroupId, authentication.getName()));
    }
     @PostMapping()
    public ResponseEntity<Void> sendJoinRequest(
            @Valid @RequestBody WorkGroupJoinRequest request,
            Authentication authentication) {
        workGroupJoinService.sendJoinRequest(request.workGroupId(), request.username(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping()
    public ResponseEntity<Void> cancelJoinRequest(
             @Valid @RequestBody WorkGroupJoinRequest request,
            Authentication authentication) {
        workGroupJoinService.cancelJoinRequest(request.workGroupId(), request.username(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/accept/{workGroupId}")
    public ResponseEntity<Void> acceptJoinRequest(
        @PathVariable Long workGroupId,
            Authentication authentication) {
                workGroupJoinService.resolveJoinRequest(workGroupId, authentication.getName(), true);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/decline/{workGroupId}")
    public ResponseEntity<Void> declineJoinRequest(
             @PathVariable Long workGroupId,
            Authentication authentication) {
        workGroupJoinService.resolveJoinRequest(workGroupId, authentication.getName(), false);
        return ResponseEntity.noContent().build();
    }
    
}
