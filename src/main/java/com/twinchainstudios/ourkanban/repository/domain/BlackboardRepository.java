package com.twinchainstudios.ourkanban.repository.domain;

import com.twinchainstudios.ourkanban.model.domain.Blackboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlackboardRepository extends JpaRepository<Blackboard, Long> {
    Optional<Blackboard> findByProjectId(Long projectId);
}