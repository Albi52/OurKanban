package com.twinchainstudios.ourkanban.repository.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twinchainstudios.ourkanban.model.domain.WorkGroup;

import java.util.List;

public interface WorkGroupRepository extends JpaRepository<WorkGroup, Long> {
    List<WorkGroup> findByUsers_Id(Long userId);
}