<?php

require_once __DIR__ . '/../config/database.php';

class Product {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    public function getAll(int $page = 1, int $perPage = 20, ?int $categoryId = null, string $search = ''): array {
        $offset = ($page - 1) * $perPage;
        $where = ['p.is_active = 1'];
        $params = [];

        if ($categoryId !== null) {
            $where[] = 'p.category_id = ?';
            $params[] = $categoryId;
        }
        if ($search !== '') {
            $where[] = 'p.name LIKE ?';
            $params[] = '%' . $search . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $params[] = $perPage;
        $params[] = $offset;

        $stmt = $this->pdo->prepare(
            "SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             $whereClause
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function count(?int $categoryId = null, string $search = ''): int {
        $where = ['is_active = 1'];
        $params = [];

        if ($categoryId !== null) {
            $where[] = 'category_id = ?';
            $params[] = $categoryId;
        }
        if ($search !== '') {
            $where[] = 'name LIKE ?';
            $params[] = '%' . $search . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM products $whereClause");
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO products (category_id, name, description, price, stock, image_url, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
        );
        $stmt->execute([
            $data['category_id'],
            $data['name'],
            $data['description'] ?? '',
            $data['price'],
            $data['stock'] ?? 0,
            $data['image_url'] ?? null,
            $data['is_active'] ?? 1,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $allowed = ['category_id', 'name', 'description', 'price', 'stock', 'image_url', 'is_active'];
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
        $stmt = $this->pdo->prepare("UPDATE products SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?");
        return $stmt->execute($params);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function decrementStock(int $id, int $quantity): bool {
        $stmt = $this->pdo->prepare(
            "UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ? AND stock >= ?"
        );
        $stmt->execute([$quantity, $id, $quantity]);
        return $stmt->rowCount() > 0;
    }

    public function incrementStock(int $id, int $quantity): bool {
        $stmt = $this->pdo->prepare(
            "UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$quantity, $id]);
    }

    public function totalCount(): int {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM products WHERE is_active = 1")->fetchColumn();
    }

    public function totalStock(): int {
        return (int) $this->pdo->query("SELECT COALESCE(SUM(stock), 0) FROM products WHERE is_active = 1")->fetchColumn();
    }
}
