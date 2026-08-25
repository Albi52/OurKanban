package com.twinchainstudios.ourkanban.controller.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.*;
import com.twinchainstudios.ourkanban.model.domain.GridEdge;
import com.twinchainstudios.ourkanban.service.domain.BlackboardService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/projects/{projectId}/blackboard")
public class BlackboardController {

    private final BlackboardService blackboardService;

    public BlackboardController(BlackboardService blackboardService) {
        this.blackboardService = blackboardService;
    }

    @GetMapping
    public BlackboardDto getBoard(@PathVariable Long projectId, Principal principal) {
        return blackboardService.getBoard(projectId, principal.getName());
    }

    @PostMapping("/elements")
    public BlackboardElementDto addElement(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateElementRequest request,
            Principal principal) {
        return blackboardService.addElement(projectId, principal.getName(), request);
    }

    @PatchMapping("/elements/{elementId}/geometry")
    public BlackboardElementDto updateGeometry(
            @PathVariable Long projectId,
            @PathVariable Long elementId,
            @Valid @RequestBody UpdateGeometryRequest request,
            Principal principal) {
        return blackboardService.updateGeometry(projectId, elementId, principal.getName(), request);
    }

    @PatchMapping("/elements/{elementId}/content")
    public BlackboardElementDto updateContent(
            @PathVariable Long projectId,
            @PathVariable Long elementId,
            @Valid @RequestBody UpdateContentRequest request,
            Principal principal) {
        return blackboardService.updateContent(projectId, elementId, principal.getName(), request);
    }

    @PostMapping("/elements/{elementId}/image")
    public BlackboardElementDto updateImage(
            @PathVariable Long projectId,
            @PathVariable Long elementId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        return blackboardService.updateImage(projectId, elementId, principal.getName(), file);
    }

    @DeleteMapping("/elements/{elementId}")
    public ResponseEntity<Void> deleteElement(

            @PathVariable Long projectId, @PathVariable Long elementId, Principal principal) {
        blackboardService.deleteElement(projectId, elementId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rows/{edge}")
    public BlackboardDto addRow(
            @PathVariable Long projectId, @PathVariable GridEdge edge, Principal principal) {
        return blackboardService.addRow(projectId, principal.getName(), edge);
    }

    @PostMapping("/columns/{edge}")
    public BlackboardDto addColumn(
            @PathVariable Long projectId, @PathVariable GridEdge edge, Principal principal) {
        return blackboardService.addColumn(projectId, principal.getName(), edge);
    }
        @PostMapping("/shrink-to-fit")
    public BlackboardDto shrinkToFit(@PathVariable Long projectId, Principal principal) {
        return blackboardService.shrinkToFit(projectId, principal.getName());
    }
        @PatchMapping("/elements/{elementId}/unstage")
    public BlackboardElementDto unstageElement(
            @PathVariable Long projectId, @PathVariable Long elementId, Principal principal) {
        return blackboardService.unstageElement(projectId, elementId, principal.getName());
    }
        @PostMapping("/elements/{elementId}/pdf")
    public BlackboardElementDto uploadPdf(
            @PathVariable Long projectId,
            @PathVariable Long elementId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        return blackboardService.uploadPdf(projectId, elementId, principal.getName(), file);
    }

    @PatchMapping("/elements/{elementId}/link")
    public BlackboardElementDto updateLink(
            @PathVariable Long projectId,
            @PathVariable Long elementId,
            @Valid @RequestBody UpdateLinkRequest request,
            Principal principal) {
        return blackboardService.updateLink(projectId, elementId, principal.getName(), request);
    }

    @GetMapping("/link-preview")
    public LinkPreviewDto getLinkPreview(
            @PathVariable Long projectId,
            @RequestParam String url,
            Principal principal) {
        return blackboardService.getLinkPreview(projectId, principal.getName(), url);
    }
}