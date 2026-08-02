package com.twinchainstudios.ourkanban.service.domain.websockets;

import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;
import com.twinchainstudios.ourkanban.model.domain.Task;
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

    public TaskService(TaskRepository taskRepository,
                        UserRepository userRepository,
                        DashboardColumnRepository columnRepository,
                        ProjectRepository projectRepository,
                        ProjectMemberRepository memberRepository
                    ) {
        this.taskRepository = taskRepository;
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
                    if(user.getRoles().stream().noneMatch(r -> r.getPermissions().contains("TASK_CREATE"))) {
                        throw new IllegalArgumentException("User does not have permission to create tasks");
                    }else{
                        return createTask(msg);
                    }
                case "MOVE":
                    if(user.getRoles().stream().noneMatch(r -> r.getPermissions().contains("TASK_EDIT"))) {
                        throw new IllegalArgumentException("User does not have permission to move tasks");
                    }else{
                        return moveTask(msg);
                    }
                case "UPDATE":
                    if(user.getRoles().stream().noneMatch(r -> r.getPermissions().contains("TASK_EDIT"))) {
                        throw new IllegalArgumentException("User does not have permission to update tasks");
                    }
                    else{
                        return updateTask(msg);
                    }
                case "DELETE":
                    if(user.getRoles().stream().noneMatch(r -> r.getPermissions().contains("TASK_DELETE"))) {
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

    private TaskDto createTask(TaskMessage msg) {
        Task t = new Task();
        t.setTitle(msg.title);
        if (msg.projectId != null) {
            Project p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            t.setProject(p);
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

    private TaskDto moveTask(TaskMessage msg) {
        Task t = taskRepository.findById(msg.taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (msg.columnId != null) {
            DashboardColumn c = columnRepository.findById(msg.columnId)
                    .orElseThrow(() -> new IllegalArgumentException("Column not found"));
            t.setColumn(c);
        }
        Task saved = taskRepository.save(t);
        return toDto(saved);
    }

    private TaskDto updateTask(TaskMessage msg) {
        Task t = taskRepository.findById(msg.taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (msg.title != null) t.setTitle(msg.title);
        if (msg.assigneeId != null) {
            ProjectMember m = memberRepository.findById(msg.assigneeId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
            t.setAssignee(m);
        }
        Task saved = taskRepository.save(t);
        return toDto(saved);
    }

    private void deleteTask(TaskMessage msg) {
        if (msg.taskId == null) throw new IllegalArgumentException("taskId required for delete");
        taskRepository.deleteById(msg.taskId);
    }

    private TaskDto toDto(Task t) {
        Long columnId = t.getColumn() != null ? t.getColumn().getId() : null;
        Long projectId = t.getProject() != null ? t.getProject().getId() : null;
        Long assigneeId = t.getAssignee() != null ? t.getAssignee().getId() : null;
        String assigneeName = t.getAssignee() != null ? t.getAssignee().getUser().getUsername() : null;
        Long authorId = t.getAuthor() != null ? t.getAuthor().getId() : null;
        String authorName = t.getAuthor() != null ? t.getAuthor().getUser().getUsername() : null;

        return new TaskDto(
            t.getId(), 
            t.getTitle(), 
            columnId, 
            projectId, 
            assigneeId,
            assigneeName,
            authorId,
            authorName
        );
    }
}
