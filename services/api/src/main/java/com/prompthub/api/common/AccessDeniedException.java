package com.prompthub.api.common;

/**
 * 리소스에 접근 권한이 없을 때 발생하는 예외 (403).
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }

    public static AccessDeniedException notOwner() {
        return new AccessDeniedException("You do not have permission to access this resource");
    }
}
