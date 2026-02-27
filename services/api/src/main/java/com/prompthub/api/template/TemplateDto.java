package com.prompthub.api.template;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Template 관련 Request/Response DTO 모음.
 */
public class TemplateDto {

    /**
     * 템플릿 생성 요청 DTO.
     * storage_path는 클라이언트에서 받지 않고 서버에서 강제 생성한다.
     */
    @Getter
    public static class CreateRequest {

        @NotBlank(message = "title is required")
        @Size(max = 200, message = "title must be 200 characters or less")
        private String title;

        @Size(max = 1000, message = "description must be 1000 characters or less")
        private String description;

        @JsonProperty("is_public")
        private boolean isPublic;
    }

    /**
     * 템플릿 수정 요청 DTO.
     * storage_path는 변경하지 않는다 (Storage 경로는 고정).
     */
    @Getter
    public static class UpdateRequest {

        @NotBlank(message = "title is required")
        @Size(max = 200, message = "title must be 200 characters or less")
        private String title;

        @Size(max = 1000, message = "description must be 1000 characters or less")
        private String description;

        @JsonProperty("is_public")
        private boolean isPublic;
    }

    /**
     * 템플릿 응답 DTO.
     */
    @Getter
    @Builder
    public static class Response {

        private UUID id;

        @JsonProperty("owner_id")
        private UUID ownerId;

        private String title;
        private String description;

        @JsonProperty("is_public")
        private boolean isPublic;

        @JsonProperty("storage_path")
        private String storagePath;

        @JsonProperty("use_count")
        private int useCount;

        @JsonProperty("created_at")
        private OffsetDateTime createdAt;

        @JsonProperty("updated_at")
        private OffsetDateTime updatedAt;

        @JsonProperty("owner_display_name")
        private String ownerDisplayName;

        @JsonProperty("owner_avatar_url")
        private String ownerAvatarUrl;

        /**
         * Template 도메인 모델을 Response DTO로 변환한다.
         */
        public static Response from(Template template) {
            return Response.builder()
                    .id(template.getId())
                    .ownerId(template.getOwnerId())
                    .title(template.getTitle())
                    .description(template.getDescription())
                    .isPublic(template.isPublic())
                    .storagePath(template.getStoragePath())
                    .useCount(template.getUseCount())
                    .createdAt(template.getCreatedAt())
                    .updatedAt(template.getUpdatedAt())
                    .ownerDisplayName(template.getOwnerDisplayName())
                    .ownerAvatarUrl(template.getOwnerAvatarUrl())
                    .build();
        }
    }
}
