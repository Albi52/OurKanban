package com.twinchainstudios.ourkanban.service.domain.websockets;

import com.twinchainstudios.ourkanban.dto.auth.UserPrincipal;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventDto;
import com.twinchainstudios.ourkanban.dto.domain.websockets.Evets.EventMessage;
import com.twinchainstudios.ourkanban.model.auth.User;
import com.twinchainstudios.ourkanban.model.domain.Event;
import com.twinchainstudios.ourkanban.model.domain.Project;
import com.twinchainstudios.ourkanban.model.domain.ProjectMember;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import com.twinchainstudios.ourkanban.repository.domain.DashboardColumnRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectRepository;
import com.twinchainstudios.ourkanban.repository.domain.ProjectMemberRepository;
import com.twinchainstudios.ourkanban.repository.domain.EventRepository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.twinchainstudios.ourkanban.exception.NotFoundException;

@Service
public class EventService {

    private final EventRepository EventRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository EventRepository,
                        UserRepository userRepository,
                        DashboardColumnRepository columnRepository,
                        ProjectRepository projectRepository,
                        ProjectMemberRepository memberRepository
                    ) 
    {
        this.EventRepository = EventRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EventDto handleMessage(EventMessage msg, UserPrincipal userPrincipal) {
        if (msg.action == null) throw new IllegalArgumentException("action required");
         Project p;

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        Long userId = user.getId();

        if (msg.projectId != null) {
            p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new NotFoundException("Project not found"));

            ProjectMember proyectMember = p.getMembers().stream()
                    .filter(m -> m.getUser().getId().equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("User not found in project"));
        

            switch (msg.action.toUpperCase()) {
                case "CREATE":
                    return createEvent(msg, proyectMember);
                case "MOVE":
                    return moveEvent(msg, userId);
                case "UPDATE":
                    return updateEvent(msg);
                case "DELETE":
                    return deleteEvent(msg);
                default:
                    throw new IllegalArgumentException("Unknown action: " + msg.action);
        }
        } else {
            throw new IllegalArgumentException("Project ID is required");
        }
    }

    private EventDto createEvent(EventMessage msg, ProjectMember projectMember) {
        Event event = new Event();
        if (msg.text != null) event.setText(msg.text);
        if (msg.date != null) event.setDate(msg.date);
        if (msg.type != null) event.setType(msg.type);
        else event.setType(com.twinchainstudios.ourkanban.model.domain.EventType.Meeting);
        event.setAuthor(projectMember);

        if (msg.projectId != null) {    
            Project p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new NotFoundException("Project not found"));
            event.setProject(p);
        }
        Event saved = EventRepository.save(event);

        return toDto(saved, "CREATED");
    }

    private EventDto moveEvent(EventMessage msg, Long userId) {
        Event event = EventRepository.findById(msg.eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (msg.date != null) {
            event.setDate(msg.date);
        }
        Event saved = EventRepository.save(event);
        String moverName = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"))
                .getUsername();

        return toDto(saved, "MOVED", msg.positionX, msg.positionY, moverName);
    }

    private EventDto updateEvent(EventMessage msg) {
        Event event = EventRepository.findById(msg.eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (msg.text != null) event.setText(msg.text);
        if (msg.date != null) event.setDate(msg.date);
        if (msg.type != null) event.setType(msg.type);
        Event saved = EventRepository.save(event);
        return toDto(saved, "UPDATED");
    }

    private EventDto deleteEvent(EventMessage msg) {
        if (msg.eventId == null) throw new IllegalArgumentException("EventId required for delete");
        Event event = EventRepository.findById(msg.eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        EventRepository.deleteById(msg.eventId);

        return toDto(event, "DELETED");
    }

    private EventDto toDto(Event event, String action) {
        Long projectId = event.getProject() != null ? event.getProject().getId() : null;
        Long authorId = event.getAuthor() != null ? event.getAuthor().getId() : null;
        String authorName = event.getAuthor() != null ? event.getAuthor().getUser().getUsername() : null;
        return new EventDto(
            event.getId(), 
            event.getText(), 
            event.getDate(), 
            event.getType(), 
            projectId, 
            authorId,
            authorName,
            action,
            null, // positionX
            null, // positionY  
            null // moverName
        );
    }    

    private EventDto toDto(Event event, String action, int positionX, int positionY, String moverName) {
        Long projectId = event.getProject() != null ? event.getProject().getId() : null;
        Long authorId = event.getAuthor() != null ? event.getAuthor().getId() : null;
        String authorName = event.getAuthor() != null ? event.getAuthor().getUser().getUsername() : null;
        return new EventDto(
            event.getId(), 
            event.getText(), 
            event.getDate(), 
            event.getType(), 
            projectId, 
            authorId,
            authorName,
            action,
            positionX,
            positionY,
            moverName
        );
    }  

    @Transactional(readOnly = true)
    public List<EventDto> getProjectEvents(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        project.getMembers().stream()
                .filter(member -> member.getUser().getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("User not found in project"));
        return EventRepository.findAll().stream()
                .filter(event -> event.getProject() != null && projectId.equals(event.getProject().getId()))
                .map(event -> toDto(event, null))
                .collect(Collectors.toList());
    }
}
