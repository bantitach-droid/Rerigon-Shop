<?php

require_once __DIR__ . '/../config/database.php';

class Announcement {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    public function getActive(): array {
        $stmt = $this->pdo->query(
            "SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC"
        );
        return $stmt->fetchAll();
    }

    public function getAll(): array {
        $stmt = $this->pdo->query(
            "SELECT * FROM announcements ORDER BY created_at DESC"
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM announcements WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $title, string $content, int $isActive = 1): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO announcements (title, content, is_active, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())"
        );
        $stmt->execute([$title, $content, $isActive]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $allowed = ['title', 'content', 'is_active'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        if (empty($fields)) {
            return false;
        }
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE announcements SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?");
        return $stmt->execute($params);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM announcements WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
