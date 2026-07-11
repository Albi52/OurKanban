package com.twinchainstudios.ourkanban.repository;

import com.twinchainstudios.ourkanban.model.WorkGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkGroupRepository extends JpaRepository<WorkGroup, Long> {
    List<WorkGroup> findByUsers_Id(Long userId);
}