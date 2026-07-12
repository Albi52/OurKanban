package com.twinchainstudios.ourkanban;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class TestingTemp implements CommandLineRunner {

    private final Environment env;

    public TestingTemp(Environment env) {
        this.env = env;
    }

    @Override
    public void run(String... args) {
        System.out.println("GOOGLE_CLIENT_ID = " + env.getProperty("GOOGLE_CLIENT_ID"));
        System.out.println("google.client-id = " + env.getProperty("google.client-id"));
    }
}