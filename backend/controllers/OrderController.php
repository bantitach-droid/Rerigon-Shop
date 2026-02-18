<?php

require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../config/database.php';

class OrderController {

    private Order $orderModel;
    private User  $userModel;

    public function __construct() {
        $this->orderModel = new Order();
        $this->userModel  = new User();
    }

    // POST /orders
    public function store(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        $body    = $this->getBody();

        $items = $body['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            Response::error('Order items are required', 422);
        }

        // Validate item structure
        foreach ($items as $item) {
            if (empty($item['product_id']) || empty($item['quantity'])) {
                Response::error('Each item must have product_id and quantity', 422);
            }
        }

        // Calculate total to verify user balance before locking rows
        $pdo = getDBConnection();
        $totalPrice = 0.0;
        foreach ($items as $item) {
            $stmt = $pdo->prepare("SELECT price, stock FROM products WHERE id = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch();
            if (!$product) {
                Response::error("Product {$item['product_id']} not found or inactive", 404);
            }
            if ($product['stock'] < (int) $item['quantity']) {
                Response::error("Insufficient stock for product {$item['product_id']}", 422);
            }
            $totalPrice += $product['price'] * (int) $item['quantity'];
        }

        $user = $this->userModel->findById($userId);
        if (!$user) {
            Response::error('User not found', 404);
        }
        if ((float) $user['balance'] < $totalPrice) {
            Response::error('Insufficient wallet balance', 422);
        }

        // Wallet deduction, order creation, status update and transaction record
        // all happen inside one atomic DB transaction.
        $pdo->beginTransaction();
        try {
            // Re-check balance with a lock to prevent race conditions
            $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
            $stmt->execute([$userId]);
            $lockedBalance = (float) $stmt->fetchColumn();
            if ($lockedBalance < $totalPrice) {
                $pdo->rollBack();
                Response::error('Insufficient wallet balance', 422);
            }

            $orderId = $this->orderModel->createWithinTransaction($pdo, $userId, $items);

            // Deduct wallet balance
            $pdo->prepare("UPDATE users SET balance = balance - ?, updated_at = NOW() WHERE id = ?")
                ->execute([$totalPrice, $userId]);

            // Mark order as completed
            $pdo->prepare("UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?")
                ->execute([$orderId]);

            // Record transaction
            $pdo->prepare(
                "INSERT INTO transactions (user_id, type, amount, reference_id, description, created_at, updated_at)
                 VALUES (?, 'purchase', ?, ?, ?, NOW(), NOW())"
            )->execute([$userId, $totalPrice, $orderId, "Order #$orderId"]);

            $pdo->commit();
        } catch (RuntimeException $e) {
            $pdo->rollBack();
            Response::error($e->getMessage(), 422);
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Order failed: ' . $e->getMessage(), 500);
        }

        $order = $this->orderModel->findById($orderId);
        Response::success($order, 'Order placed successfully', 201);
    }

    // GET /orders
    public function index(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $orders = $this->orderModel->getByUser($userId, $page, $perPage);
        $total  = $this->orderModel->countByUser($userId);
        Response::paginated($orders, $total, $page, $perPage);
    }

    // GET /orders/{id}
    public function show(int $id): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];

        $order = $this->orderModel->findById($id, $userId);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        Response::success($order);
    }

    // GET /admin/orders
    public function adminIndex(): void {
        AdminMiddleware::handle();
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));
        $status  = $_GET['status'] ?? '';

        $orders = $this->orderModel->getAll($page, $perPage, $status);
        $total  = $this->orderModel->countAll($status);
        Response::paginated($orders, $total, $page, $perPage);
    }

    // PUT /admin/orders/{id}/status
    public function updateStatus(int $id): void {
        AdminMiddleware::handle();
        $body   = $this->getBody();
        $status = $body['status'] ?? '';

        $allowed = ['pending', 'completed', 'cancelled', 'refunded'];
        if (!in_array($status, $allowed, true)) {
            Response::error('Invalid status. Allowed: ' . implode(', ', $allowed), 422);
        }

        $order = $this->orderModel->findById($id);
        if (!$order) {
            Response::error('Order not found', 404);
        }

        $this->orderModel->updateStatus($id, $status);
        Response::success(null, 'Order status updated');
    }

    // POST /admin/orders/{id}/refund
    public function refund(int $id): void {
        AdminMiddleware::handle();

        $order = $this->orderModel->findById($id);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        if ($order['status'] === 'refunded') {
            Response::error('Order already refunded', 409);
        }

        $pdo = getDBConnection();
        $pdo->beginTransaction();
        try {
            $this->orderModel->updateStatus($id, 'refunded');
            $this->userModel->updateBalance((int) $order['user_id'], (float) $order['total_price']);

            // Restore stock for each item
            foreach ($order['items'] as $item) {
                $pdo->prepare(
                    "UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?"
                )->execute([$item['quantity'], $item['product_id']]);
            }

            // Record refund transaction
            $pdo->prepare(
                "INSERT INTO transactions (user_id, type, amount, reference_id, description, created_at, updated_at)
                 VALUES (?, 'refund', ?, ?, ?, NOW(), NOW())"
            )->execute([$order['user_id'], $order['total_price'], $id, "Refund for Order #$id"]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Refund failed: ' . $e->getMessage(), 500);
        }

        Response::success(null, 'Order refunded successfully');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
