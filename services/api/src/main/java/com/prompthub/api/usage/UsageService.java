package com.prompthub.api.usage;

import com.prompthub.api.common.AccessDeniedException;
import com.prompthub.api.common.ResourceNotFoundException;
import com.prompthub.api.template.Template;
import com.prompthub.api.template.TemplateMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Usage Event 비즈니스 로직.
 * 이벤트 기록과 동시에 templates.use_count를 원자적으로 증가시킨다.
 */
@Service
public class UsageService {

    private final UsageMapper usageMapper;
    private final TemplateMapper templateMapper;

    public UsageService(UsageMapper usageMapper, TemplateMapper templateMapper) {
        this.usageMapper = usageMapper;
        this.templateMapper = templateMapper;
    }

    /**
     * 사용 이벤트를 기록하고 use_count를 1 증가시킨다.
     * 비공개 템플릿은 소유자만 사용 이벤트를 기록할 수 있다 (V-04).
     *
     * @param request       템플릿 ID를 담은 요청 DTO
     * @param currentUserId JWT에서 추출한 사용자 ID
     * @return 생성된 이벤트 정보
     */
    @Transactional
    public UsageDto.Response recordUsage(UsageDto.CreateRequest request, UUID currentUserId) {
        // 템플릿 존재 여부 확인
        Template template = templateMapper.findById(request.getTemplateId())
                .orElseThrow(() -> ResourceNotFoundException.of("Template", request.getTemplateId()));

        // 비공개 템플릿은 소유자만 사용 이벤트 기록 가능 (V-04: use_count 어뷰징 방지)
        if (!template.isPublic() && !template.getOwnerId().equals(currentUserId)) {
            throw new AccessDeniedException("Cannot record usage for a private template");
        }

        // 사용 이벤트 생성
        UsageEvent event = new UsageEvent();
        event.setId(UUID.randomUUID());
        event.setTemplateId(request.getTemplateId());
        event.setUserId(currentUserId);
        event.setUsedAt(OffsetDateTime.now());

        usageMapper.insert(event);

        // use_count 증가
        templateMapper.incrementUseCount(request.getTemplateId());

        return UsageDto.Response.builder()
                .id(event.getId())
                .templateId(event.getTemplateId())
                .userId(event.getUserId())
                .usedAt(event.getUsedAt())
                .build();
    }
}
