package com.prompthub.api.template;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * templates 테이블 도메인 모델.
 */
@Getter
@Setter
@NoArgsConstructor
public class Template {

    private UUID id;
    private UUID ownerId;
    private String title;
    private String description;
    private boolean isPublic;
    private String storagePath;
    private int useCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // profiles 테이블 JOIN용 (목록 조회 시 포함)
    private String ownerDisplayName;
    private String ownerAvatarUrl;
}
