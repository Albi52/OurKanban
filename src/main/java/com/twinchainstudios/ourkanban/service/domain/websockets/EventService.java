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
                return createEvent(msg);
            case "MOVE":
                return moveEvent(msg);
            case "UPDATE":
                return updateEvent(msg);
            case "DELETE":
                deleteEvent(msg);
                return null;
            default:
                throw new IllegalArgumentException("Unknown action: " + msg.action);
        }
        } else {
            throw new IllegalArgumentException("Project ID is required");
        }
    }

    private EventDto createEvent(EventMessage msg) {
        Event event = new Event();
        if (msg.text != null) event.setText(msg.text);
        if (msg.date != null) event.setDate(msg.date);
        if (msg.type != null) event.setType(msg.type);

        if (msg.projectId != null) {    
            Project p = projectRepository.findById(msg.projectId)
                    .orElseThrow(() -> new NotFoundException("Project not found"));
            event.setProject(p);
        }
        Event saved = EventRepository.save(event);

        return toDto(saved);
    }

    private EventDto moveEvent(EventMessage msg) {
        Event event = EventRepository.findById(msg.eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (msg.date != null) {
            event.setDate(msg.date);
        }
        Event saved = EventRepository.save(event);
        return toDto(saved);
    }

    private EventDto updateEvent(EventMessage msg) {
        Event event = EventRepository.findById(msg.eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (msg.text != null) event.setText(msg.text);
        if (msg.date != null) event.setDate(msg.date);
        if (msg.type != null) event.setType(msg.type);
        Event saved = EventRepository.save(event);
        return toDto(saved);
    }

    private void deleteEvent(EventMessage msg) {
        if (msg.eventId == null) throw new IllegalArgumentException("EventId required for delete");
        EventRepository.deleteById(msg.eventId);
    }

    private EventDto toDto(Event event) {
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
            authorName
        );
    }
}
