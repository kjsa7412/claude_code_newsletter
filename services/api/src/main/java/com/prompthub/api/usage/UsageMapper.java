package com.prompthub.api.usage;

import org.apache.ibatis.annotations.Mapper;

/**
 * usage_events 테이블 MyBatis Mapper 인터페이스.
 * SQL은 UsageMapper.xml에 정의된다.
 */
@Mapper
public interface UsageMapper {

    /**
     * 사용 이벤트 기록.
     */
    void insert(UsageEvent event);
}
