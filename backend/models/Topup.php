<?php

require_once __DIR__ . '/../config/database.php';

class Topup {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    public function create(int $userId, float $amount, string $method, float $fee = 0.0, ?string $slipUrl = null): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO topups (user_id, amount, method, fee, status, slip_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())"
        );
        $stmt->execute([$userId, $amount, $method, $fee, $slipUrl]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT t.*, u.username, u.email
             FROM topups t
             JOIN users u ON u.id = t.user_id
             WHERE t.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getByUser(int $userId, int $page = 1, int $perPage = 20): array {
        $offset = ($page - 1) * $perPage;
        $stmt = $this->pdo->prepare(
            "SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->execute([$userId, $perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function countByUser(int $userId): int {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM topups WHERE user_id = ?");
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    public function getAll(int $page = 1, int $perPage = 20, string $status = ''): array {
        $offset = ($page - 1) * $perPage;
        $where = '';
        $params = [];

        if ($status !== '') {
            $where = 'WHERE t.status = ?';
            $params[] = $status;
        }
        $params[] = $perPage;
        $params[] = $offset;

        $stmt = $this->pdo->prepare(
            "SELECT t.*, u.username, u.email
             FROM topups t
             JOIN users u ON u.id = t.user_id
             $where
             ORDER BY t.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function countAll(string $status = ''): int {
        if ($status !== '') {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM topups WHERE status = ?");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM topups");
        }
        return (int) $stmt->fetchColumn();
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->pdo->prepare("UPDATE topups SET status = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
