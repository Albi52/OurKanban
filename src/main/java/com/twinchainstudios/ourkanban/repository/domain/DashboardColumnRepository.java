package com.twinchainstudios.ourkanban.repository.domain;

import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DashboardColumnRepository extends JpaRepository<DashboardColumn, Long> {
    List<DashboardColumn> findByProjectIdOrderByPosition(Long projectId);
}