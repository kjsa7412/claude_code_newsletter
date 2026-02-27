package com.prompthub.api.ranking;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 랭킹 집계 MyBatis Mapper 인터페이스.
 * SQL은 RankingMapper.xml에 정의된다.
 */
@Mapper
public interface RankingMapper {

    /**
     * 최근 7일간 usage_events 집계 Top N.
     *
     * @param limit 반환할 최대 건수 (기본 10)
     */
    List<RankingDto> findWeeklyRanking(@Param("limit") int limit);
}
