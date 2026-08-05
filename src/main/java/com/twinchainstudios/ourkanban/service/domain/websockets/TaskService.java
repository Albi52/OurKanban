package com.twinchainstudios.ourkanban.service.domain.websockets;

import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;
import com.twinchainstudios.ourkanban.model.domain.PermissionCodes;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;
import com.twinchainstudios.ourkanban.model.domain.Task;
import com.twinchainstudios.ourkanban.model.domain.TaskPriority;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import com.twinchainstudios.ourkanban.repository.domain.DashboardColumnRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectMemberRepository;
import com.twinchainstudios.ourkanban.repository.domain.TaskRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final DashboardColumnRepository columnRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                        UserRepository userRepository,
                        DashboardColumnRepository columnRepository,
                        ProjectRepository projectRepository,
                        ProjectMemberRepository memberRepository
                    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.columnRepository = columnRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public TaskDto handleMessage(TaskMessage msg, Long userId) {
        if (msg.action == null) throw new IllegalArgumentException("action required");
        Project p;
        if(msg.projectId != null) {
            p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                    
            ProjectMember user = p.getMembers().stream().filter(
                    m -> m.getId().equals(userId)).findFirst().orElseThrow(
                () -> new IllegalArgumentException("User not found in project")
                );

            switch (msg.action.toUpperCase()) {
                case "CREATE":
                    if(user.getRoles().stream().noneMatch(r -> 
                        r.getPermissions().stream().anyMatch(perm -> 
                            perm.getCode().equals(PermissionCodes.TASK_CREATE)
                        ))
                    )
                    {
                        throw new IllegalArgumentException("User does not have permission to create tasks");
                    }else{
                        return createTask(msg, userId);
                    }
                case "MOVE":
                    if(user.getRoles().stream().noneMatch(r -> 
                        r.getPermissions().stream().anyMatch(perm -> 
                            perm.getCode().equals(PermissionCodes.TASK_EDIT)))) 
                    {
                        throw new IllegalArgumentException("User does not have permission to move tasks");
                    }else{
                        return moveTask(msg, userId);
                    }
                case "UPDATE":
                    if(user.getRoles().stream().noneMatch(r -> 
                        r.getPermissions().stream().anyMatch(perm -> 
                            perm.getCode().equals(PermissionCodes.TASK_EDIT)))) {
                        throw new IllegalArgumentException("User does not have permission to update tasks");
                    }
                    else{
                        return updateTask(msg);
                    }
                case "DELETE":
                    if(user.getRoles().stream().noneMatch(r -> 
                        r.getPermissions().stream().anyMatch(perm -> 
                            perm.getCode().equals(PermissionCodes.TASK_DELETE)))
                        ) 
                    {
                        throw new IllegalArgumentException("User does not have permission to delete tasks");
                    }else{
                        deleteTask(msg);
                    }
                    return null;
                default:
                    throw new IllegalArgumentException("Unknown action: " + msg.action);
            }
        }
        else {
            throw new IllegalArgumentException("Project ID is required");
        }
    }

    private TaskDto createTask(TaskMessage msg, Long userId) {
        Task t = new Task();
        t.setTitle(msg.title);
        if (msg.projectId != null) {
            Project p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            t.setProject(p);
            
            ProjectMember user = memberRepository.findByProjectIdAndUserId(msg.projectId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found in project"));

            t.setAuthor(user);
        }
        if (msg.columnId != null) {
            DashboardColumn c = columnRepository.findById(msg.columnId)
                    .orElseThrow(() -> new IllegalArgumentException("Column not found"));
            t.setColumn(c);
        }
        if (msg.assigneeId != null) {
            ProjectMember m = memberRepository.findById(msg.assigneeId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
            t.setAssignee(m);
        }
        Task saved = taskRepository.save(t);
        return toDto(saved);
    }

    private TaskDto moveTask(TaskMessage msg, Long userId) {
        Task t = getLockedTask(msg.taskId);
        Task saved = taskRepository.save(t);

        String moverName = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getUsername();

        if (msg.columnId != null) {
            DashboardColumn c = columnRepository.findById(msg.columnId)
                    .orElseThrow(() -> new IllegalArgumentException("Column not found"));
            t.setColumn(c);
        }

        return toDto(saved, msg.positionX, msg.positionY, moverName);
    }

    private TaskDto updateTask(TaskMessage msg) {
        Task t = getLockedTask(msg.taskId);

        //Info task
        if (msg.title != null) t.setTitle(msg.title);

        if(msg.description != null) t.setDescription(msg.description);

        if(msg.priority != null) t.setPriority(TaskPriority.valueOf(msg.priority.toString().toUpperCase()));
        
        //Asignados
        if (msg.assigneeId != null) {
            ProjectMember m = memberRepository.findById(msg.assigneeId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
            t.setAssignee(m);
        }

        if(msg.dateStart != null) t.setStartDate(msg.dateStart);
        if(msg.dateEnd != null) t.setEndDate(msg.dateEnd);

        Task saved = taskRepository.save(t);
        return toDto(saved);
    }

    
    private void deleteTask(TaskMessage msg) {
        Task t = getLockedTask(msg.taskId);
        taskRepository.delete(t);
    }

    private Task getLockedTask(Long taskId) {
        if (taskId == null) throw new IllegalArgumentException("taskId required");
        return taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
    }

    private TaskDto toDto(Task t) {
        String priority = t.getPriority() != null ? t.getPriority().name() : null;
        Long columnId = t.getColumn() != null ? t.getColumn().getId() : null;
        Long projectId = t.getProject() != null ? t.getProject().getId() : null;
        Long assigneeId = t.getAssignee() != null ? t.getAssignee().getId() : null;
        String assigneeName = t.getAssignee() != null ? t.getAssignee().getUser().getUsername() : null;
        Long authorId = t.getAuthor() != null ? t.getAuthor().getId() : null;
        String authorName = t.getAuthor() != null ? t.getAuthor().getUser().getUsername() : null;

        return new TaskDto(
            t.getId(), 
            t.getTitle(), 
            t.getDescription(),
            priority,
            columnId, 
            projectId, 
            assigneeId,
            assigneeName,
            authorId,
            authorName,
            0,
            0,
            t.getStartDate(),
            t.getEndDate(),
            null
        );
    }
    private TaskDto toDto(Task t, int positionX, int positionY, String moverName) {
        String priority = t.getPriority() != null ? t.getPriority().name() : null;
        Long columnId = t.getColumn() != null ? t.getColumn().getId() : null;
        Long projectId = t.getProject() != null ? t.getProject().getId() : null;
        Long assigneeId = t.getAssignee() != null ? t.getAssignee().getId() : null;
        String assigneeName = t.getAssignee() != null ? t.getAssignee().getUser().getUsername() : null;
        Long authorId = t.getAuthor() != null ? t.getAuthor().getId() : null;
        String authorName = t.getAuthor() != null ? t.getAuthor().getUser().getUsername() : null;

        return new TaskDto(
            t.getId(), 
            t.getTitle(), 
            t.getDescription(),
            priority,
            columnId, 
            projectId, 
            assigneeId,
            assigneeName,
            authorId,
            authorName,
            positionX,
            positionY,
            t.getStartDate(),
            t.getEndDate(),
            moverName
        );
    }
}
