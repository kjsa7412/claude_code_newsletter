package com.prompthub.api.ranking;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * 주간 랭킹 응답 DTO.
 */
@Getter
@Setter
@NoArgsConstructor
public class RankingDto {

    /**
     * 순위 (1부터 시작).
     */
    private int rank;

    @JsonProperty("template_id")
    private UUID templateId;

    private String title;

    private String description;

    @JsonProperty("owner_id")
    private UUID ownerId;

    @JsonProperty("owner_display_name")
    private String ownerDisplayName;

    @JsonProperty("owner_avatar_url")
    private String ownerAvatarUrl;

    /**
     * 최근 7일간 사용 횟수.
     */
    @JsonProperty("use_count_weekly")
    private int useCountWeekly;
}
