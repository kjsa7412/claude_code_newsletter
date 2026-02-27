package com.prompthub.api.usage;

import com.prompthub.api.auth.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 템플릿 사용 이벤트 기록 REST 컨트롤러.
 */
@RestController
@RequestMapping("/api/usage")
public class UsageController {

    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    /**
     * POST /api/usage
     * 템플릿 사용 이벤트를 기록하고 use_count를 증가시킨다.
     */
    @PostMapping
    public ResponseEntity<UsageDto.Response> recordUsage(
            @Valid @RequestBody UsageDto.CreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        UsageDto.Response response = usageService.recordUsage(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
