<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class UserController {

    private User $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function profile(): void {
        $payload = AuthMiddleware::handle();
        $user = $this->userModel->findById((int) $payload['sub']);
        if (!$user) {
            Response::error('User not found', 404);
        }
        Response::success($user);
    }

    public function updateProfile(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        $body    = $this->getBody();

        $username = trim($body['username'] ?? '');
        if (empty($username) || strlen($username) < 3) {
            Response::error('Username must be at least 3 characters', 422);
        }

        $existing = $this->userModel->findByUsername($username);
        if ($existing && (int) $existing['id'] !== $userId) {
            Response::error('Username is already taken', 409);
        }

        $this->userModel->updateUsername($userId, $username);
        $user = $this->userModel->findById($userId);
        Response::success($user, 'Profile updated');
    }

    public function changePassword(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        $body    = $this->getBody();

        $currentPassword = $body['current_password'] ?? '';
        $newPassword     = $body['new_password'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            Response::error('current_password and new_password are required', 422);
        }
        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters', 422);
        }

        // Need the full user row including password hash
        $stmt = getDBConnection()->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPassword, $user['password'])) {
            Response::error('Current password is incorrect', 401);
        }

        $this->userModel->updatePassword($userId, $newPassword);
        Response::success(null, 'Password changed successfully');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
