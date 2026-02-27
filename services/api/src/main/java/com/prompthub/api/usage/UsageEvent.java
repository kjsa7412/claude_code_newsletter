package com.prompthub.api.usage;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * usage_events 테이블 도메인 모델.
 */
@Getter
@Setter
@NoArgsConstructor
public class UsageEvent {

    private UUID id;
    private UUID templateId;
    private UUID userId;
    private OffsetDateTime usedAt;
}
