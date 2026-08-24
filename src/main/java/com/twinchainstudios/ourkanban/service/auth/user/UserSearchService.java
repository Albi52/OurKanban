package com.twinchainstudios.ourkanban.service.auth.user;

import com.twinchainstudios.ourkanban.dto.auth.response.UserSearchResult;
import com.twinchainstudios.ourkanban.repository.auth.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserSearchService {

    private final UserRepository userRepository;

    public UserSearchService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return userRepository.findTop10ByUsernameContainingIgnoreCaseOrderByUsernameAsc(query.trim())
                .stream()
                .map(u -> new UserSearchResult(u.getUsername(), u.getProfilePicture()))
                .toList();
    }
}