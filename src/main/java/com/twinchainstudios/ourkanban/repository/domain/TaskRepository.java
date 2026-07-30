package com.twinchainstudios.ourkanban.repository.domain;

import com.twinchainstudios.ourkanban.model.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
}