package com.prompthub.api.usage;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Usage Event 관련 Request/Response DTO.
 */
public class UsageDto {

    /**
     * 사용 이벤트 기록 요청 DTO.
     */
    @Getter
    public static class CreateRequest {

        @NotNull(message = "template_id is required")
        @JsonProperty("template_id")
        private UUID templateId;
    }

    /**
     * 사용 이벤트 응답 DTO.
     */
    @Getter
    @Builder
    public static class Response {

        private UUID id;

        @JsonProperty("template_id")
        private UUID templateId;

        @JsonProperty("user_id")
        private UUID userId;

        @JsonProperty("used_at")
        private OffsetDateTime usedAt;
    }
}
