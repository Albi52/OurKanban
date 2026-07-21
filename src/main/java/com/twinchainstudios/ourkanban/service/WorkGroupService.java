package com.twinchainstudios.ourkanban.service;

import com.twinchainstudios.ourkanban.dto.application.request.AddMemberRequest;
import com.twinchainstudios.ourkanban.dto.application.request.CreateWorkGroupRequest;
import com.twinchainstudios.ourkanban.dto.application.response.MemberResponse;
import com.twinchainstudios.ourkanban.dto.application.response.ProjectResponse;
import com.twinchainstudios.ourkanban.dto.application.response.WorkGroupResponse;
import com.twinchainstudios.ourkanban.exception.*;
import com.twinchainstudios.ourkanban.model.User;
import com.twinchainstudios.ourkanban.model.WorkGroup;
import com.twinchainstudios.ourkanban.repository.UserRepository;
import com.twinchainstudios.ourkanban.repository.WorkGroupRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkGroupService {

    private final WorkGroupRepository workGroupRepository;
    private final UserRepository userRepository;

    public WorkGroupService(WorkGroupRepository workGroupRepository, UserRepository userRepository) {
        this.workGroupRepository = workGroupRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkGroupResponse> getWorkGroupsForUser(String username) {
        User user = getUserOrThrow(username);
        return workGroupRepository.findByUsers_Id(user.getId())
                .stream()
                .map(wg -> toResponse(wg, user))
                .toList();
    }

    @Transactional
    public WorkGroupResponse createWorkGroup(CreateWorkGroupRequest request, String username) {
        User user = getUserOrThrow(username);

        WorkGroup workGroup = new WorkGroup();
        workGroup.setName(request.name());
        workGroup.setLeader(user);
        workGroup.getUsers().add(user);

        workGroupRepository.save(workGroup);
        return toResponse(workGroup, user);
    }

    @Transactional
    public void leaveWorkGroup(Long workGroupId, String username) {
        User user = getUserOrThrow(username);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new WorkGroupNotFoundException("Group not found"));

        boolean wasMember = workGroup.getUsers().removeIf(u -> u.getId().equals(user.getId()));
        if (!wasMember) {
            throw new NotAMemberException("You are not a member of this group");
        }

        if (workGroup.getUsers().isEmpty()) {
            workGroupRepository.delete(workGroup);
            return;
        }

        if (workGroup.getLeader().getId().equals(user.getId())) {
            User newLeader = workGroup.getUsers().iterator().next();
            workGroup.setLeader(newLeader);
        }

        workGroupRepository.save(workGroup);
    }

    /**
     * Adds a user to the group directly.
     * NOTE: this is a placeholder for a future invitation flow — when that's built,
     * this method's internals should change to create a pending WorkGroupInvitation
     * and notify the target user instead of adding them immediately. The controller
     * endpoint and request/response shape can stay the same.
     */
    @Transactional
    public WorkGroupResponse addMember(Long workGroupId, AddMemberRequest request, String requesterUsername) {
        User requester = getUserOrThrow(requesterUsername);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new WorkGroupNotFoundException("Group not found"));

        requireLeader(workGroup, requester);

        User newMember = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with username: " + request.username()));

        boolean alreadyMember = workGroup.getUsers().stream()
                .anyMatch(u -> u.getId().equals(newMember.getId()));
        if (alreadyMember) {
            throw new AlreadyMemberException("User is already a member of this group");
        }

        workGroup.getUsers().add(newMember);
        workGroupRepository.save(workGroup);

        return toResponse(workGroup, requester);
    }

    @Transactional
    public WorkGroupResponse removeMember(Long workGroupId, Long memberUserId, String requesterUsername) {
        User requester = getUserOrThrow(requesterUsername);
        WorkGroup workGroup = workGroupRepository.findById(workGroupId)
                .orElseThrow(() -> new WorkGroupNotFoundException("Group not found"));

        requireLeader(workGroup, requester);

        if (workGroup.getLeader().getId().equals(memberUserId)) {
            throw new CannotRemoveLeaderException(
                    "The leader cannot be removed. Transfer leadership or leave the group instead.");
        }

        boolean wasMember = workGroup.getUsers().removeIf(u -> u.getId().equals(memberUserId));
        if (!wasMember) {
            throw new NotAMemberException("That user is not a member of this group");
        }

        workGroupRepository.save(workGroup);
        return toResponse(workGroup, requester);
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
    private WorkGroupResponse toResponse(WorkGroup wg, User currentUser) {
        List<ProjectResponse> projects = wg.getProjects().stream()
                .map(p -> new ProjectResponse(p.getId(), p.getName(), p.getWorkGroup().getId(), true))
                .toList();

        List<MemberResponse> members = wg.getUsers().stream()
                .map(u -> new MemberResponse(u.getId(), u.getUsername()))
                .toList();

        return new WorkGroupResponse(
                wg.getId(),
                wg.getName(),
                wg.getLeader().getUsername(),
                wg.getLeader().getId().equals(currentUser.getId()),
                projects,
                members
        );
    }
}