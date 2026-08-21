package com.twinchainstudios.ourkanban.service.domain;


import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.BlackboardDto;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.BlackboardElementDto;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.CreateElementRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.UpdateContentRequest;
import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.UpdateGeometryRequest;
import com.twinchainstudios.ourkanban.exception.ConflictException;
import com.twinchainstudios.ourkanban.exception.ForbiddenOperationException;
import com.twinchainstudios.ourkanban.exception.NotFoundException;
import com.twinchainstudios.ourkanban.model.domain.*;
import com.twinchainstudios.ourkanban.repository.domain.BlackboardElementRepository;
import com.twinchainstudios.ourkanban.repository.domain.BlackboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BlackboardService {

    private final BlackboardRepository blackboardRepository;
    private final BlackboardElementRepository elementRepository;
    private final BlackboardImageStorageService imageStorageService;
    private final ProjectService projectService;

    public BlackboardService(
            BlackboardRepository blackboardRepository,
            BlackboardElementRepository elementRepository,
            BlackboardImageStorageService imageStorageService,
            ProjectService projectService) {
        this.blackboardRepository = blackboardRepository;
        this.elementRepository = elementRepository;
        this.imageStorageService = imageStorageService;
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

        validatePlacement(board, request.row(), request.col(), request.width(), request.height(), null);

        BlackboardElement element = new BlackboardElement();
        element.setBlackboard(board);
        element.setCreator(member);
        element.setType(request.type());
        element.setRow(request.row());
        element.setCol(request.col());
        element.setWidth(request.width());
        element.setHeight(request.height());
        element.setTextContent(request.textContent());

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
    public void deleteElement(Long projectId, Long elementId, String username) {
        Project project = projectService.getProjectAndVerifyMembership(projectId, username);
        BlackboardElement element = getElementOrThrow(project, elementId);

        if (!canDelete(project, element, username)) {
            throw new ForbiddenOperationException("Only the creator or the group leader can delete this element");
        }

        if (element.getImageUrl() != null) {
            imageStorageService.delete(elementId);
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