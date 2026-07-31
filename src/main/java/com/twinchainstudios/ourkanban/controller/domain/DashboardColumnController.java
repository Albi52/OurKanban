package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.ColumnResponse;
import com.twinchainstudios.ourkanban.dto.domain.projects.CreateColumnRequest;
import com.twinchainstudios.ourkanban.service.domain.DashboardColumnService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/columns")
public class DashboardColumnController {

    private final DashboardColumnService dashboardColumnService;

    public DashboardColumnController(DashboardColumnService dashboardColumnService) {
        this.dashboardColumnService = dashboardColumnService;
    }

    @GetMapping
    public ResponseEntity<List<ColumnResponse>> getColumns(
            @PathVariable Long projectId,
            Authentication authentication) {
        return ResponseEntity.ok(dashboardColumnService.getColumns(projectId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ColumnResponse> addColumn(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateColumnRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(dashboardColumnService.addColumn(projectId, request, authentication.getName()));
    }
}
