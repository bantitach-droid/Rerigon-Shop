<?php

require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

class AdminMiddleware {

    /**
     * Validate JWT and require role === 'admin'.
     * Returns the decoded payload array on success, or calls Response::error and exits.
     */
    public static function handle(): array {
        $payload = AuthMiddleware::handle();

        if (($payload['role'] ?? '') !== 'admin') {
            Response::error('Admin access required', 403);
        }

        return $payload;
    }
}
