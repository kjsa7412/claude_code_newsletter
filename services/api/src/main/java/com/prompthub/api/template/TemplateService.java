package com.prompthub.api.template;

import com.prompthub.api.auth.UserPrincipal;
import com.prompthub.api.common.AccessDeniedException;
import com.prompthub.api.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Template 비즈니스 로직.
 */
@Service
@Transactional(readOnly = true)
public class TemplateService {

    private final TemplateMapper templateMapper;

    public TemplateService(TemplateMapper templateMapper) {
        this.templateMapper = templateMapper;
    }

    /**
     * 템플릿 목록 조회.
     * filter=mine  -> 본인 소유 템플릿만
     * filter=public -> 공개 템플릿만
     * filter=all (default) -> 본인 소유 + 공개 템플릿
     */
    public List<TemplateDto.Response> getTemplates(UUID currentUserId, String filter) {
        String normalizedFilter = (filter == null || filter.isBlank()) ? "all" : filter.toLowerCase();
        if (!List.of("mine", "public", "all").contains(normalizedFilter)) {
            throw new IllegalArgumentException("filter must be one of: mine, public, all");
        }
        return templateMapper.findAll(currentUserId, normalizedFilter)
                .stream()
                .map(TemplateDto.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 템플릿 단건 조회.
     * 본인 소유이거나 공개 템플릿인 경우에만 접근 허용.
     */
    public TemplateDto.Response getTemplate(UUID id, UUID currentUserId) {
        Template template = findTemplateOrThrow(id);
        checkReadAccess(template, currentUserId);
        return TemplateDto.Response.from(template);
    }

    /**
     * 템플릿 생성.
     */
    @Transactional
    public TemplateDto.Response createTemplate(TemplateDto.CreateRequest request, UUID currentUserId) {
        Template template = new Template();
        template.setId(UUID.randomUUID());
        template.setOwnerId(currentUserId);
        template.setTitle(request.getTitle());
        template.setDescription(request.getDescription());
        template.setPublic(request.isPublic());
        // Generate storage path on server to prevent client-side path manipulation (V-03)
        template.setStoragePath(currentUserId + "/" + template.getId() + ".md");
        template.setUseCount(0);

        OffsetDateTime now = OffsetDateTime.now();
        template.setCreatedAt(now);
        template.setUpdatedAt(now);

        templateMapper.insert(template);

        // 생성 후 DB에서 재조회해 profiles JOIN 정보도 포함
        return TemplateDto.Response.from(findTemplateOrThrow(template.getId()));
    }

    /**
     * 템플릿 수정.
     * 본인 소유만 허용.
     */
    @Transactional
    public TemplateDto.Response updateTemplate(UUID id, TemplateDto.UpdateRequest request, UUID currentUserId) {
        Template template = findTemplateOrThrow(id);
        checkOwnership(template, currentUserId);

        template.setTitle(request.getTitle());
        template.setDescription(request.getDescription());
        template.setPublic(request.isPublic());
        // storage_path is immutable after creation (V-03)
        template.setUpdatedAt(OffsetDateTime.now());

        templateMapper.update(template);
        return TemplateDto.Response.from(findTemplateOrThrow(id));
    }

    /**
     * 템플릿 삭제.
     * 본인 소유만 허용.
     */
    @Transactional
    public void deleteTemplate(UUID id, UUID currentUserId) {
        Template template = findTemplateOrThrow(id);
        checkOwnership(template, currentUserId);

        int affected = templateMapper.deleteById(id, currentUserId);
        if (affected == 0) {
            throw new ResourceNotFoundException("Template not found or already deleted: " + id);
        }
    }

    /**
     * 공개 템플릿 복제.
     * 공개 템플릿의 메타데이터를 복사해 현재 사용자 소유의 새 템플릿 생성.
     */
    @Transactional
    public TemplateDto.Response cloneTemplate(UUID originalId, UUID currentUserId) {
        Template original = findTemplateOrThrow(originalId);

        if (!original.isPublic() && !original.getOwnerId().equals(currentUserId)) {
            throw new AccessDeniedException("Cannot clone a private template you do not own");
        }

        Template cloned = new Template();
        cloned.setId(UUID.randomUUID());
        cloned.setOwnerId(currentUserId);
        cloned.setTitle(original.getTitle() + " (clone)");
        cloned.setDescription(original.getDescription());
        cloned.setPublic(false);
        cloned.setStoragePath(currentUserId + "/clone_" + originalId + ".md");
        cloned.setUseCount(0);

        OffsetDateTime now = OffsetDateTime.now();
        cloned.setCreatedAt(now);
        cloned.setUpdatedAt(now);

        templateMapper.insert(cloned);
        return TemplateDto.Response.from(findTemplateOrThrow(cloned.getId()));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Template findTemplateOrThrow(UUID id) {
        return templateMapper.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Template", id));
    }

    private void checkReadAccess(Template template, UUID currentUserId) {
        if (!template.isPublic() && !template.getOwnerId().equals(currentUserId)) {
            throw new AccessDeniedException("Access denied: template is private");
        }
    }

    private void checkOwnership(Template template, UUID currentUserId) {
        if (!template.getOwnerId().equals(currentUserId)) {
            throw AccessDeniedException.notOwner();
        }
    }
}
