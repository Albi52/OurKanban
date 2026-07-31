package com.twinchainstudios.ourkanban.service.domain.websockets;

import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Tasks.TaskMessage;
import com.twinchainstudios.ourkanban.model.domain.DashboardColumn;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;
import com.twinchainstudios.ourkanban.model.domain.Task;
import com.twinchainstudios.ourkanban.repository.domain.DashboardColumnRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectMemberRepository;
import com.twinchainstudios.ourkanban.repository.domain.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final DashboardColumnRepository columnRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public TaskService(TaskRepository taskRepository,
                       DashboardColumnRepository columnRepository,
                       ProjectRepository projectRepository,
                       ProjectMemberRepository memberRepository) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public TaskDto handleMessage(TaskMessage msg) {
        if (msg.action == null) throw new IllegalArgumentException("action required");

        switch (msg.action.toUpperCase()) {
            case "CREATE":
                return createTask(msg);
            case "MOVE":
                return moveTask(msg);
            case "UPDATE":
                return updateTask(msg);
            case "DELETE":
                deleteTask(msg);
                return null;
            default:
                throw new IllegalArgumentException("Unknown action: " + msg.action);
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
        return new TaskDto(t.getId(), t.getTitle(), columnId, projectId, assigneeId);
    }
}
