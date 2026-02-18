<?php

// Load from environment variables when available; fall back to development defaults.
// In production, set these as server/environment variables and do NOT commit real values.
define('DB_HOST',    $_ENV['DB_HOST']    ?? getenv('DB_HOST')    ?: 'localhost');
define('DB_NAME',    $_ENV['DB_NAME']    ?? getenv('DB_NAME')    ?: 'rerigon_shop');
define('DB_USER',    $_ENV['DB_USER']    ?? getenv('DB_USER')    ?: 'root');
define('DB_PASS',    $_ENV['DB_PASS']    ?? getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

function getDBConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}
