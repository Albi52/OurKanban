package com.twinchainstudios.ourkanban.repository.domain;

import com.twinchainstudios.ourkanban.model.domain.BlackboardElement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlackboardElementRepository extends JpaRepository<BlackboardElement, Long> {
}