package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.BlackboardDto;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.BlackboardElementDto;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.CreateElementRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.LinkPreviewDto;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.UpdateContentRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.UpdateGeometryRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.UpdateLinkRequest;
import com.twinchainstudios.ourkanban.exception.ConflictException;
import com.twinchainstudios.ourkanban.exception.ForbiddenOperationException;
import com.twinchainstudios.ourkanban.exception.NotFoundException;
import com.twinchainstudios.ourkanban.model.domain.*;
import com.twinchainstudios.ourkanban.repository.domain.BlackboardElementRepository;
import com.twinchainstudios.ourkanban.repository.domain.BlackboardRepository;

import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
public class BlackboardService {

    private final BlackboardRepository blackboardRepository;
    private final BlackboardElementRepository elementRepository;
    private final BlackboardImageStorageService imageStorageService;
    private final PdfStorageService pdfStorageService;
    private final LinkPreviewService linkPreviewService;
    private final ProjectService projectService;

    public BlackboardService(
            BlackboardRepository blackboardRepository,
            BlackboardElementRepository elementRepository,
            BlackboardImageStorageService imageStorageService,
            PdfStorageService pdfStorageService,
            LinkPreviewService linkPreviewService,
            ProjectService projectService) {
        this.blackboardRepository = blackboardRepository;
        this.elementRepository = elementRepository;
        this.imageStorageService = imageStorageService;
        this.pdfStorageService = pdfStorageService;
        this.linkPreviewService = linkPreviewService;
        this.projectService = projectService;
    }

    @Transactional
    public BlackboardDto getBoard(Long projectId, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        Blackboard board = getOrCreateBlackboard(project);
        return BlackboardDto.from(board);
    }

    @Transactional
    public BlackboardElementDto addElement(Long projectId, String username, CreateElementRequest request) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        Blackboard board = getOrCreateBlackboard(project);
        ProjectMember member = resolveMember(project, username);
         if (request.attachmentType() == AttachmentType.LINK
                && (request.linkUrl() == null || request.linkUrl().isBlank())) {
            throw new ConflictException("A link element needs a URL");
        }
        if (request.attachmentType() == AttachmentType.NONE
                && (request.textContent() == null || request.textContent().isBlank())) {
            throw new ConflictException("Add some text, or choose an image, PDF, or link");
        }
        BlackboardElement element = new BlackboardElement();
        element.setBlackboard(board);
        element.setCreator(member);
        element.setAttachmentType(request.attachmentType());
        element.setWidth(request.width());
        element.setHeight(request.height());
        element.setTextContent(request.textContent());
        if (request.attachmentType() == AttachmentType.LINK) {
            element.setLinkUrl(request.linkUrl().trim());
        }

        if (request.row() != null && request.col() != null) {
            validatePlacement(board, request.row(), request.col(), request.width(), request.height(), null);
            element.setRow(request.row());
            element.setCol(request.col());
        }
        // else: created directly in the shelf, row/col stay null

        element = elementRepository.save(element);
        return BlackboardElementDto.from(element);
    }

    @Transactional
    public BlackboardElementDto updateGeometry(
            Long projectId, Long elementId, String username, UpdateGeometryRequest request) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        validatePlacement(
                element.getBlackboard(), request.row(), request.col(), request.width(), request.height(), elementId);

        element.setRow(request.row());
        element.setCol(request.col());
        element.setWidth(request.width());
        element.setHeight(request.height());

        return BlackboardElementDto.from(element);
    }

    @Transactional
    public BlackboardElementDto unstageElement(Long projectId, Long elementId, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        element.setRow(null);
        element.setCol(null);

        return BlackboardElementDto.from(element);
    }

    @Transactional
    public BlackboardElementDto updateContent(
            Long projectId, Long elementId, String username, UpdateContentRequest request) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        element.setTextContent(request.textContent());
        return BlackboardElementDto.from(element);
    }

    @Transactional
    public BlackboardElementDto updateImage(
            Long projectId, Long elementId, String username, MultipartFile file) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        String url = imageStorageService.store(file, elementId);
        element.setImageUrl(url);

        return BlackboardElementDto.from(element);
    }
    @Transactional
    public BlackboardElementDto uploadPdf(Long projectId, Long elementId, String username, MultipartFile file) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        if (element.getAttachmentType() != AttachmentType.PDF) {
            throw new ConflictException("This element isn't a PDF element");
        }

        PdfStorageService.StoredPdf stored = pdfStorageService.store(file, elementId);
        element.setPdfUrl(stored.pdfUrl());
        element.setPdfThumbnailUrl(stored.thumbnailUrl());
        element.setPdfFileName(stored.originalFileName());

        return BlackboardElementDto.from(element);
    }

    @Transactional
    public BlackboardElementDto updateLink(Long projectId, Long elementId, String username, UpdateLinkRequest request) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        if (element.getAttachmentType() != AttachmentType.LINK) {
            throw new ConflictException("This element isn't a link element");
        }

        element.setLinkUrl(request.linkUrl().trim());
        return BlackboardElementDto.from(element);
    }

    @Transactional(readOnly = true)
    public LinkPreviewDto getLinkPreview(Long projectId, String username, String url) {
        projectService.getProjectAndVerifyMembership(projectId, username);
        return linkPreviewService.fetchPreview(url);
    }
    @Transactional
    public void deleteElement(Long projectId, Long elementId, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        if (!canDelete(project, element, username)) {
            throw new ForbiddenOperationException("Only the creator or the group leader can delete this element");
        }

        if (element.getImageUrl() != null) {
            imageStorageService.delete(elementId);
        }
        if (element.getPdfUrl() != null) {
            pdfStorageService.delete(elementId);
        }
        elementRepository.delete(element);
    }

    @Transactional
    public BlackboardDto addRow(Long projectId, String username, GridEdge edge) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        Blackboard board = getOrCreateBlackboard(project);

        if (edge == GridEdge.TOP) {
            board.setMinRow(board.getMinRow() - 1);
        } else if (edge == GridEdge.BOTTOM) {
            board.setMaxRow(board.getMaxRow() + 1);
        } else {
            throw new ConflictException("Rows can only be added to the TOP or BOTTOM edge");
        }

        return BlackboardDto.from(board);
    }

    @Transactional
    public BlackboardDto addColumn(Long projectId, String username, GridEdge edge) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        Blackboard board = getOrCreateBlackboard(project);

        if (edge == GridEdge.LEFT) {
            board.setMinCol(board.getMinCol() - 1);
        } else if (edge == GridEdge.RIGHT) {
            board.setMaxCol(board.getMaxCol() + 1);
        } else {
            throw new ConflictException("Columns can only be added to the LEFT or RIGHT edge");
        }

        return BlackboardDto.from(board);
    }

    private static final int DEFAULT_SIZE = 6;

    @Transactional
    public BlackboardDto shrinkToFit(Long projectId, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        Blackboard board = getOrCreateBlackboard(project);

        List<BlackboardElement> placed = board.getElements().stream()
                .filter(e -> e.getRow() != null && e.getCol() != null)
                .collect(Collectors.toList());

        if (placed.isEmpty()) {
            // Nothing to fit around — just reset to the original default size.
            board.setMinRow(0);
            board.setMaxRow(DEFAULT_SIZE - 1);
            board.setMinCol(0);
            board.setMaxCol(DEFAULT_SIZE - 1);
            return BlackboardDto.from(board);
        }

        int tightMinRow = placed.stream().mapToInt(BlackboardElement::getRow).min().getAsInt();
        int tightMaxRow = placed.stream().mapToInt(e -> e.getRow() + e.getHeight() - 1).max().getAsInt();
        int tightMinCol = placed.stream().mapToInt(BlackboardElement::getCol).min().getAsInt();
        int tightMaxCol = placed.stream().mapToInt(e -> e.getCol() + e.getWidth() - 1).max().getAsInt();

        int[] rowBounds = expandToMinimum(tightMinRow, tightMaxRow, DEFAULT_SIZE);
        int[] colBounds = expandToMinimum(tightMinCol, tightMaxCol, DEFAULT_SIZE);

        board.setMinRow(rowBounds[0]);
        board.setMaxRow(rowBounds[1]);
        board.setMinCol(colBounds[0]);
        board.setMaxCol(colBounds[1]);

        return BlackboardDto.from(board);
    }

    // Grows a [min, max] range symmetrically around its own center until it
    // reaches at least `minSize` cells, without ever making it smaller than
    // the tight fit that was passed in. Elements never move — only the
    // board's bounds change, so any extra cells from this padding always
    // land as empty space around what's already placed.
    private int[] expandToMinimum(int min, int max, int minSize) {
        int currentSize = max - min + 1;
        if (currentSize >= minSize) {
            return new int[] { min, max };
        }
        int deficit = minSize - currentSize;
        int padBefore = deficit / 2;
        int padAfter = deficit - padBefore;
        return new int[] { min - padBefore, max + padAfter };
    }

    // --- internal helpers ---

    private Blackboard getOrCreateBlackboard(Project project) {
        return blackboardRepository.findByProjectId(project.getId())
                .orElseGet(() -> {
                    Blackboard board = new Blackboard();
                    board.setProject(project);
                    return blackboardRepository.save(board);
                });
    }

    private ProjectMember resolveMember(Project project, String username) {
        return project.getMembers().stream()
                .filter(m -> m.getUser().getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this project"));
    }

    private BlackboardElement getElementOrThrow(Project project, Long elementId) {
        BlackboardElement element = elementRepository.findById(elementId)
                .orElseThrow(() -> new NotFoundException("Element not found"));

        if (!element.getBlackboard().getProject().getId().equals(project.getId())) {
            throw new NotFoundException("Element not found");
        }
        return element;
    }

    private boolean canDelete(Project project, BlackboardElement element, String username) {
        boolean isCreator = element.getCreator() != null
                && element.getCreator().getUser().getUsername().equals(username);
        boolean isLeader = project.getWorkGroup().getLeader().getUsername().equals(username);
        return isCreator || isLeader;
    }

    // Checks bounds against the board's current size and rejects any overlap
    // with a sibling element. excludeElementId is passed (non-null) on
    // move/resize so an element doesn't collide with its own previous
    // position.
    private void validatePlacement(
            Blackboard board, int row, int col, int width, int height, Long excludeElementId) {

        if (row < board.getMinRow()
                || col < board.getMinCol()
                || row + height - 1 > board.getMaxRow()
                || col + width - 1 > board.getMaxCol()) {
            throw new ConflictException("Element does not fit within the blackboard bounds");
        }

        for (BlackboardElement other : board.getElements()) {
            if (other.getRow() == null || other.getCol() == null) {
                continue; // shelf elements don't count
            }
            if (excludeElementId != null && other.getId().equals(excludeElementId)) {
                continue;
            }
            boolean overlaps = !(col + width <= other.getCol()
                    || other.getCol() + other.getWidth() <= col
                    || row + height <= other.getRow()
                    || other.getRow() + other.getHeight() <= row);
            if (overlaps) {
                throw new ConflictException("Elements cannot overlap");
            }
        }
    }
}