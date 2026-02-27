package com.prompthub.api;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.prompthub.api")
public class PromptHubApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PromptHubApiApplication.class, args);
    }
}
