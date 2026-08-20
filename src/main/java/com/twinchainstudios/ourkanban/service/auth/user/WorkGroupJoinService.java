package com.twinchainstudios.ourkanban.service.auth.user;

import com.twinchainstudios.ourkanban.dto.auth.response.UserSearchResult;
import com.twinchainstudios.ourkanban.dto.auth.response.WorkGroupJoinResponse;
import com.twinchainstudios.ourkanban.exception.*;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.model.auth.WorkGroupJoin;
import com.twinchainstudios.ourkanban.model.domain.WorkGroup;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import com.twinchainstudios.ourkanban.repository.domain.WorkGroupRepository;
import com.twinchainstudios.ourkanban.service.auth.EmailService;
import com.twinchainstudios.ourkanban.service.domain.WorkGroupService;
import com.twinchainstudios.ourkanban.repository.auth.WorkGroupJoinRequestRepository;
import com.twinchainstudios.ourkanban.model.auth.JoinRequestStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service 
public class WorkGroupJoinService {

    private final WorkGroupRepository workGroupRepository;
    private final UserRepository userRepository;
    private final WorkGroupJoinRequestRepository workGroupJoinRequestRepository;
    private final EmailService emailService;
    private final WorkGroupService workGroupService;

    public WorkGroupJoinService(WorkGroupRepository workGroupRepository, UserRepository userRepository,
            WorkGroupJoinRequestRepository workGroupJoinRequestRepository, EmailService emailService, WorkGroupService workGroupService) {
        this.workGroupRepository = workGroupRepository;
        this.userRepository = userRepository;
        this.workGroupJoinRequestRepository = workGroupJoinRequestRepository;
        this.emailService = emailService;
        this.workGroupService = workGroupService;
    }

    @Transactional(readOnly = true)
    public List<WorkGroupJoinResponse> getPendingJoinRequestsForUser(String username) {
        User user = getUserOrThrow(username);
        return workGroupJoinRequestRepository.findByUserAndStatus(user, JoinRequestStatus.PENDING)
                .stream()
                .map(joinRequest -> toResponse(joinRequest, user))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> getPendingJoinRequestOfGroup(Long workGroupId, String username) {
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new NotFoundException("Work group not found"));
        workGroupService.requireLeader(workGroup, getUserOrThrow(username));

        return workGroupJoinRequestRepository.findByWorkGroupAndStatus(workGroup, JoinRequestStatus.PENDING)
                .stream()
                .map(joinRequest -> new UserSearchResult(joinRequest.getUser().getUsername(),
                        joinRequest.getUser().getProfilePicture()))
                .toList();
    }


    @Transactional
    public void resolveJoinRequest(Long workGroupId, String invitedUsername, boolean accept) {
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new NotFoundException("Work group not found"));
        User invitedUser = getUserOrThrow(invitedUsername);

        WorkGroupJoin joinRequest = workGroupJoinRequestRepository.findByUserAndWorkGroup(invitedUser, workGroup)
                .orElseThrow(() -> new NotFoundException("Join request not found"));

        if (accept) {

            workGroupService.addMember(workGroup, invitedUser);
            joinRequest.setStatus(JoinRequestStatus.ACCEPTED);
        } else {
            joinRequest.setStatus(JoinRequestStatus.REJECTED);
        }

        joinRequest.setRespondedAt(java.time.LocalDateTime.now());

        workGroupJoinRequestRepository.save(joinRequest);
    }

    @Transactional
    public void cancelJoinRequest(Long workGroupId, String invitedUsername, String actorUsername) {

        User invitedUser = getUserOrThrow(invitedUsername);
        User actorUser = getUserOrThrow(actorUsername);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new NotFoundException("Work group not found"));

        WorkGroupJoin joinRequest = workGroupJoinRequestRepository.findByUserAndWorkGroup(invitedUser, workGroup)
                .orElseThrow(() -> new NotFoundException("Join request not found"));

        workGroupService.requireLeader(workGroup, actorUser);
        joinRequest.setStatus(JoinRequestStatus.CANCELED);
        workGroupJoinRequestRepository.save(joinRequest);
    }

    @Transactional
    public void sendJoinRequest(Long workGroupId, String invitedUsername, String invitorUsername) {
        User user = getUserOrThrow(invitedUsername);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new NotFoundException("Work group not found"));
        User invitor = getUserOrThrow(invitorUsername);
        workGroupService.requireLeader(workGroup, invitor);

        WorkGroupJoin joinRequest = new WorkGroupJoin();
        joinRequest.setUser(user);
        joinRequest.setWorkGroup(workGroup);
        joinRequest.setInvitedBy(invitor);
        joinRequest.setStatus(JoinRequestStatus.PENDING);
        joinRequest.setCreatedAt(java.time.LocalDateTime.now());
        workGroupJoinRequestRepository.save(joinRequest);
        emailService.sendJoinRequestEmail(user.getEmail(), workGroup.getName(), invitor.getUsername());
    }

    private User getUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private WorkGroupJoinResponse toResponse(WorkGroupJoin wg, User currentUser) {

        return new WorkGroupJoinResponse(
                wg.getWorkGroup().getName(),
                wg.getUser().getUsername(),
                wg.getUser().getProfilePicture());
    }

}
