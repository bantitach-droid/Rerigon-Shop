<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../config/database.php';

class DashboardController {

    private User    $userModel;
    private Product $productModel;
    private Order   $orderModel;

    public function __construct() {
        $this->userModel    = new User();
        $this->productModel = new Product();
        $this->orderModel   = new Order();
    }

    // GET /dashboard/stats  [any authenticated user]
    public function stats(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];

        $pdo = getDBConnection();

        // User-level stats
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
        $stmt->execute([$userId]);
        $myOrders = (int) $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE user_id = ? AND status = 'completed'");
        $stmt->execute([$userId]);
        $mySpend = (float) $stmt->fetchColumn();

        $user = $this->userModel->findById($userId);

        Response::success([
            'my_orders'        => $myOrders,
            'my_total_spend'   => $mySpend,
            'wallet_balance'   => (float) $user['balance'],
            'total_products'   => $this->productModel->totalCount(),
            'total_stock'      => $this->productModel->totalStock(),
        ]);
    }
}
