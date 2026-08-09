package com.twinchainstudios.ourkanban.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twinchainstudios.ourkanban.model.auth.JoinRequestStatus;
import com.twinchainstudios.ourkanban.model.auth.WorkGroupJoin;

import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.model.domain.WorkGroup;
import java.util.List;

import java.util.Optional;

public interface WorkGroupJoinRequestRepository extends JpaRepository<WorkGroupJoin, Long> {
    List<WorkGroupJoin> findByUserAndStatus(
            User user,
            JoinRequestStatus status);
    
            List<WorkGroupJoin> findByWorkGroup(WorkGroup workGroup);
            
    Optional<WorkGroupJoin> findByUserAndWorkGroup(User user, WorkGroup workGroup);
}