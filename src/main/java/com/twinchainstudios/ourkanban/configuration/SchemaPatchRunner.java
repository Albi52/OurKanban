package com.twinchainstudios.ourkanban.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaPatchRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaPatchRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public SchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    @EventListener(ApplicationReadyEvent.class)
    public void patchDatabaseSchema() {
        try {

            //TODO: en algun momento quitar esto, como en un mes o así -26/08/2026
            log.info("Checking and applying automated schema patches...");
            // Converts the strict MySQL ENUM to a flexible VARCHAR for all existing databases
            jdbcTemplate.execute("ALTER TABLE blackboard_elements MODIFY attachmentType VARCHAR(255)");
            log.info("Schema patch applied successfully.");
        } catch (Exception e) {
            log.warn("Schema patch encountered an issue (usually safe to ignore if already applied): {}", e.getMessage());
        }
    }
}