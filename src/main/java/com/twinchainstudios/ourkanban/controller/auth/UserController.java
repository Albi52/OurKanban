package com.twinchainstudios.ourkanban.controller.auth;

import com.twinchainstudios.ourkanban.dto.auth.response.UserSearchResult;
import com.twinchainstudios.ourkanban.service.auth.user.UserSearchService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserSearchService userSearchService;

    public UserController(UserSearchService userSearchService) {
        this.userSearchService = userSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResult>> search(@RequestParam String query) {
        return ResponseEntity.ok(userSearchService.search(query));
    }
}