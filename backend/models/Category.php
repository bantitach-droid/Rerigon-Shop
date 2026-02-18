<?php

require_once __DIR__ . '/../config/database.php';

class Category {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    public function getAll(): array {
        $stmt = $this->pdo->query(
            "SELECT c.*, COUNT(p.id) AS product_count
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
             GROUP BY c.id
             ORDER BY c.name ASC"
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM categories WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $name, string $description = '', string $icon = ''): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO categories (name, description, icon, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())"
        );
        $stmt->execute([$name, $description, $icon]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $allowed = ['name', 'description', 'icon'];
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
        $stmt = $this->pdo->prepare("UPDATE categories SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?");
        return $stmt->execute($params);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM categories WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
