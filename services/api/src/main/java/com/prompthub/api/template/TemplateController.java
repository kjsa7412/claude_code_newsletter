package com.prompthub.api.template;

import com.prompthub.api.auth.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 템플릿 메타데이터 CRUD REST 컨트롤러.
 * 모든 엔드포인트는 JWT 인증이 필요하다.
 */
@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * GET /api/templates?filter=all|mine|public
     * 내 템플릿 + 공개 템플릿 목록 반환.
     */
    @GetMapping
    public ResponseEntity<List<TemplateDto.Response>> getTemplates(
            @RequestParam(value = "filter", defaultValue = "all") String filter,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<TemplateDto.Response> result = templateService.getTemplates(principal.getUserId(), filter);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/templates
     * 새 템플릿 생성.
     */
    @PostMapping
    public ResponseEntity<TemplateDto.Response> createTemplate(
            @Valid @RequestBody TemplateDto.CreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        TemplateDto.Response response = templateService.createTemplate(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/templates/{id}
     * 템플릿 상세 조회 (본인 소유 또는 공개 템플릿만 허용).
     */
    @GetMapping("/{id}")
    public ResponseEntity<TemplateDto.Response> getTemplate(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        TemplateDto.Response response = templateService.getTemplate(id, principal.getUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/templates/{id}
     * 템플릿 수정 (본인 소유만 허용).
     */
    @PutMapping("/{id}")
    public ResponseEntity<TemplateDto.Response> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody TemplateDto.UpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        TemplateDto.Response response = templateService.updateTemplate(id, request, principal.getUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/templates/{id}
     * 템플릿 삭제 (본인 소유만 허용).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        templateService.deleteTemplate(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/templates/{id}/clone
     * 공개 템플릿 복제.
     */
    @PostMapping("/{id}/clone")
    public ResponseEntity<TemplateDto.Response> cloneTemplate(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        TemplateDto.Response response = templateService.cloneTemplate(id, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
