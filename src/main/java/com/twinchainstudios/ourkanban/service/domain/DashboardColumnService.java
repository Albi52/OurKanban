package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.ColumnResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.CreateColumnRequest;
import com.twinchainstudios.ourkanban.exception.ConflictException;
import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.repository.domain.DashboardColumnRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardColumnService {

    private final ProjectService projectService;
    private final DashboardColumnRepository dashboardColumnRepository;

    public DashboardColumnService(ProjectService projectService,
                                  DashboardColumnRepository dashboardColumnRepository) {
        this.projectService = projectService;
        this.dashboardColumnRepository = dashboardColumnRepository;
    }

    @Transactional(readOnly = true)
    public List<ColumnResponse> getColumns(Long projectId, String username) {
        projectService.getProjectAndVerifyMembership(projectId, username);
        return dashboardColumnRepository.findByProjectIdOrderByPosition(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ColumnResponse addColumn(Long projectId, CreateColumnRequest request, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);

        DashboardColumn column = new DashboardColumn();
        column.setName(request.name());
        column.setPosition(calculateNextPosition(projectId));
        column.setProject(project);

        try {
            column = dashboardColumnRepository.save(column);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("A column with that name already exists in this project");
        }

        return toResponse(column);
    }

    private int calculateNextPosition(Long projectId) {
        return dashboardColumnRepository.findByProjectIdOrderByPosition(projectId).size();
    }

    private ColumnResponse toResponse(DashboardColumn column) {
        return new ColumnResponse(column.getId(), column.getName(), column.getPosition());
    }
}
