<?php

require_once __DIR__ . '/../config/database.php';

class User {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare("SELECT id, username, email, balance, role, is_banned, created_at, updated_at FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByUsername(string $username): ?array {
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $username, string $email, string $password, string $role = 'user'): int {
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->pdo->prepare(
            "INSERT INTO users (username, email, password, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())"
        );
        $stmt->execute([$username, $email, $hashed, $role]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateUsername(int $id, string $username): bool {
        $stmt = $this->pdo->prepare("UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$username, $id]);
    }

    public function updatePassword(int $id, string $newPassword): bool {
        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $this->pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$hashed, $id]);
    }

    public function updateBalance(int $id, float $amount): bool {
        $stmt = $this->pdo->prepare("UPDATE users SET balance = balance + ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$amount, $id]);
    }

    public function setRole(int $id, string $role): bool {
        $stmt = $this->pdo->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$role, $id]);
    }

    public function setBanned(int $id, int $isBanned): bool {
        $stmt = $this->pdo->prepare("UPDATE users SET is_banned = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$isBanned, $id]);
    }

    public function getAll(int $page = 1, int $perPage = 20): array {
        $offset = ($page - 1) * $perPage;
        $stmt = $this->pdo->prepare(
            "SELECT id, username, email, balance, role, is_banned, created_at, updated_at
             FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->execute([$perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function count(): int {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    }

    public function countNewSince(string $since): int {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE created_at >= ?");
        $stmt->execute([$since]);
        return (int) $stmt->fetchColumn();
    }
}
