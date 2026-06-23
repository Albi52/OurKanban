package com.twinchainstudios.ourkanban.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomePageController {
    @GetMapping("/")
    public String home() {
        return "Welcome to the OurKanban API!";
    }
    @GetMapping("/secured")
    public String secured() {
        return "Welcome to the secured section of the OurKanban API!";
    }
}
