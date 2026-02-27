package com.prompthub.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/**
 * Authorization: Bearer <jwt> 헤더를 파싱하여 Supabase JWT를 검증하고
 * SecurityContext에 UserPrincipal을 저장하는 필터.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    // V-06: Use ObjectMapper to properly escape error messages in JSON responses
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String jwtSecret;

    public JwtAuthFilter(@Value("${supabase.jwt.secret}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (!StringUtils.hasText(token)) {
            writeUnauthorized(response, "Authorization header is missing or invalid");
            return;
        }

        try {
            Claims claims = parseToken(token);

            String sub = claims.getSubject();
            if (sub == null) {
                writeUnauthorized(response, "JWT subject (sub) is missing");
                return;
            }

            UUID userId = UUID.fromString(sub);
            String email = claims.get("email", String.class);

            UserPrincipal principal = new UserPrincipal(userId, email);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            log.warn("Expired JWT token: {}", e.getMessage());
            writeUnauthorized(response, "JWT token has expired");
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            writeUnauthorized(response, "JWT token is invalid");
        } catch (IllegalArgumentException e) {
            log.warn("Invalid UUID in JWT sub: {}", e.getMessage());
            writeUnauthorized(response, "JWT subject is not a valid UUID");
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    // V-06: Use ObjectMapper to properly escape error messages and prevent JSON injection
    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(MAPPER.writeValueAsString(Map.of("error", message)));
    }
}
