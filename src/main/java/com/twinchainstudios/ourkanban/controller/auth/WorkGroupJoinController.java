package com.twinchainstudios.ourkanban.controller.auth;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.twinchainstudios.ourkanban.dto.auth.request.WorkGroupJoinRequest;
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

     @PostMapping()
    public ResponseEntity<Void> sendJoinRequest(
            @Valid @RequestBody WorkGroupJoinRequest request,
            Authentication authentication) {
        workGroupJoinService.sendJoinRequest(request.workGroupId(), request.username(), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping()
    public ResponseEntity<Void> cancelJoinRequest(
             @Valid @RequestBody WorkGroupJoinRequest request,
            Authentication authentication) {
        workGroupJoinService.cancelJoinRequest(request.workGroupId(), request.username(), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/accept/{workGroupId}")
    public ResponseEntity<Void> acceptJoinRequest(
        @PathVariable Long workGroupId,
            Authentication authentication) {
                workGroupJoinService.resolveJoinRequest(workGroupId, authentication.getName(), true);
        return ResponseEntity.ok().build();
    }
    @PatchMapping("/decline/{workGroupId}")
    public ResponseEntity<Void> declineJoinRequest(
             @PathVariable Long workGroupId,
            Authentication authentication) {
        workGroupJoinService.resolveJoinRequest(workGroupId, authentication.getName(), false);
        return ResponseEntity.ok().build();
    }
    
}
