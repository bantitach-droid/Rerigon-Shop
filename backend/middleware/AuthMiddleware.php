<?php

require_once __DIR__ . '/../helpers/JWT.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../config/config.php';

class AuthMiddleware {

    /**
     * Validate JWT from Authorization header.
     * Returns the decoded payload array on success, or calls Response::error and exits.
     */
    public static function handle(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($authHeader) || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            Response::error('Authorization token required', 401);
        }

        $token = $matches[1];
        $payload = JWT::decode($token, JWT_SECRET);

        if ($payload === false) {
            Response::error('Invalid or expired token', 401);
        }

        return $payload;
    }
}
