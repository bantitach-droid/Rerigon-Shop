<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../config/config.php';

class RateLimitMiddleware {

    /**
     * Check rate limit for the given identifier (IP address by default).
     * Uses the `rate_limits` table in the database.
     */
    public static function handle(string $identifier = ''): void {
        if (empty($identifier)) {
            $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }

        $pdo  = getDBConnection();
        $now  = time();
        $windowStart = $now - RATE_LIMIT_WINDOW;

        // Atomically insert or reset the window for a new identifier/expired window,
        // and increment for an active window. Then verify the count.
        $pdo->prepare(
            "INSERT INTO rate_limits (identifier, requests, window_start)
             VALUES (?, 1, ?)
             ON DUPLICATE KEY UPDATE
                 requests     = IF(window_start < ?, 1, requests + 1),
                 window_start = IF(window_start < ?, VALUES(window_start), window_start)"
        )->execute([$identifier, $now, $windowStart, $windowStart]);

        $stmt = $pdo->prepare("SELECT requests FROM rate_limits WHERE identifier = ?");
        $stmt->execute([$identifier]);
        $requests = (int) $stmt->fetchColumn();

        if ($requests > RATE_LIMIT_REQUESTS) {
            Response::error('Too many requests. Please try again later.', 429);
        }
    }
}
