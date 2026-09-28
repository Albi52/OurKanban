package com.twinchainstudios.ourkanban.repository.domain;

import com.twinchainstudios.ourkanban.model.domain.Blackboard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlackboardRepository extends JpaRepository<Blackboard, Long> {
    Optional<Blackboard> findByProjectId(Long projectId);
}