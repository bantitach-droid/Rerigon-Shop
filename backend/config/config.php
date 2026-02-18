<?php

// Load from environment variables when available; fall back to development defaults.
// In production, set JWT_SECRET as a strong random environment variable.
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: 'rerigon_shop_secret_key_2024_secure');
define('JWT_EXPIRY', 86400); // 24 hours
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('BASE_URL',   $_ENV['BASE_URL']   ?? getenv('BASE_URL')   ?: 'http://localhost:8000');
// Restrict CORS origin in production (e.g., 'https://rerigon.shop')
define('CORS_ORIGIN', $_ENV['CORS_ORIGIN'] ?? getenv('CORS_ORIGIN') ?: '*');
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024); // 5 MB
define('RATE_LIMIT_REQUESTS', 100);
define('RATE_LIMIT_WINDOW', 60); // seconds
