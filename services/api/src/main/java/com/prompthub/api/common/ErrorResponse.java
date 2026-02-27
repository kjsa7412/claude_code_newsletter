package com.prompthub.api.common;

/**
 * 공통 에러 응답 포맷.
 * {"error": "message"}
 */
public record ErrorResponse(String error) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(message);
    }
}
