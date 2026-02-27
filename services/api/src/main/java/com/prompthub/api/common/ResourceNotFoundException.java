package com.prompthub.api.common;

/**
 * 요청한 리소스가 존재하지 않을 때 발생하는 예외 (404).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resourceName, Object id) {
        return new ResourceNotFoundException(resourceName + " not found: " + id);
    }
}
