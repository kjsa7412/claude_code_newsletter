package com.prompthub.api.ranking;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 주간 랭킹 REST 컨트롤러.
 */
@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    private final RankingMapper rankingMapper;

    public RankingController(RankingMapper rankingMapper) {
        this.rankingMapper = rankingMapper;
    }

    /**
     * GET /api/rankings/weekly?limit=10
     * 최근 7일간 사용 횟수 기준 Top N 랭킹 반환.
     */
    @GetMapping("/weekly")
    public ResponseEntity<List<RankingDto>> getWeeklyRanking(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {

        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }

        List<RankingDto> rankings = rankingMapper.findWeeklyRanking(limit);
        return ResponseEntity.ok(rankings);
    }
}
