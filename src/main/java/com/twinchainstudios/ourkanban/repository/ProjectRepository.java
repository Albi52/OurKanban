package com.twinchainstudios.ourkanban.repository;

import com.twinchainstudios.ourkanban.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}