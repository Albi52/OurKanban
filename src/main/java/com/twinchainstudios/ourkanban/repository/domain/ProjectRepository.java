package com.twinchainstudios.ourkanban.repository.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twinchainstudios.ourkanban.model.domain.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}