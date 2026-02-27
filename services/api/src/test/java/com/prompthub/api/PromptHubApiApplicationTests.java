package com.prompthub.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/test",
        "spring.datasource.username=postgres",
        "spring.datasource.password=postgres",
        "supabase.jwt.secret=test-secret-key-must-be-at-least-32-characters",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration"
})
class PromptHubApiApplicationTests {

    @Test
    void contextLoads() {
        // Spring Context가 정상적으로 로드되는지 확인
    }
}
