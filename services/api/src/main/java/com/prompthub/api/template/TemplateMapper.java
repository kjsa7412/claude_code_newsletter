package com.prompthub.api.template;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * templates 테이블 MyBatis Mapper 인터페이스.
 * SQL은 TemplateMapper.xml에 정의된다.
 */
@Mapper
public interface TemplateMapper {

    /**
     * 템플릿 목록 조회.
     *
     * @param currentUserId 현재 사용자 ID (본인 소유 필터링용)
     * @param filter        "mine" | "public" | "all"
     */
    List<Template> findAll(@Param("currentUserId") UUID currentUserId,
                           @Param("filter") String filter);

    /**
     * 템플릿 단건 조회 (profiles JOIN 포함).
     */
    Optional<Template> findById(@Param("id") UUID id);

    /**
     * 템플릿 생성.
     */
    void insert(Template template);

    /**
     * 템플릿 수정.
     */
    int update(Template template);

    /**
     * 템플릿 삭제.
     */
    int deleteById(@Param("id") UUID id, @Param("ownerId") UUID ownerId);

    /**
     * use_count 증가 (usage event 기록 시 호출).
     */
    int incrementUseCount(@Param("id") UUID id);
}
