<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/JWT.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../config/config.php';

class AuthController {

    private User $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function register(): void {
        $body = $this->getBody();

        $username = trim($body['username'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        $errors = [];
        if (empty($username) || strlen($username) < 3) {
            $errors['username'] = 'Username must be at least 3 characters.';
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'A valid email is required.';
        }
        if (empty($password) || strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters.';
        }
        if (!empty($errors)) {
            Response::error('Validation failed', 422, $errors);
        }

        if ($this->userModel->findByEmail($email)) {
            Response::error('Email is already registered', 409);
        }
        if ($this->userModel->findByUsername($username)) {
            Response::error('Username is already taken', 409);
        }

        $id   = $this->userModel->create($username, $email, $password);
        $user = $this->userModel->findById($id);

        Response::success($user, 'Registration successful', 201);
    }

    public function login(): void {
        $body = $this->getBody();

        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            Response::error('Email and password are required', 422);
        }

        $user = $this->userModel->findByEmail($email);
        if (!$user || !password_verify($password, $user['password'])) {
            Response::error('Invalid credentials', 401);
        }

        if ($user['is_banned']) {
            Response::error('Your account has been banned', 403);
        }

        $payload = [
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + JWT_EXPIRY,
        ];
        $token = JWT::encode($payload, JWT_SECRET);

        Response::success([
            'token' => $token,
            'user'  => [
                'id'       => $user['id'],
                'username' => $user['username'],
                'email'    => $user['email'],
                'balance'  => $user['balance'],
                'role'     => $user['role'],
            ],
        ], 'Login successful');
    }

    public function logout(): void {
        // JWT is stateless; client should discard the token
        Response::success(null, 'Logged out successfully');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
