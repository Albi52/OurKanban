package com.twinchainstudios.ourkanban;

import com.twinchainstudios.ourkanban.model.domain.Permission;
import com.twinchainstudios.ourkanban.model.domain.PermissionCodes;
import com.twinchainstudios.ourkanban.repository.domain.PermissionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PermissionDataSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;

    public PermissionDataSeeder(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @Override
    public void run(String... args) {
        createPermissionIfMissing(PermissionCodes.PROJECT_VIEW, "View a project and its details");
        createPermissionIfMissing(PermissionCodes.PROJECT_EDIT, "Edit project metadata and board contents");
        createPermissionIfMissing(PermissionCodes.PROJECT_DELETE, "Delete a project");
    }

    private void createPermissionIfMissing(String code, String description) {
        if (permissionRepository.existsByCode(code)) {
            return;
        }

        Permission permission = new Permission();
        permission.setCode(code);
        permission.setDescription(description);
        permissionRepository.save(permission);
    }
}
