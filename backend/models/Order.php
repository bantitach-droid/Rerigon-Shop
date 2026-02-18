<?php

require_once __DIR__ . '/../config/database.php';

class Order {

    private PDO $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    /**
     * Create an order (header + items + stock decrement) using an *already-open*
     * external transaction. The caller is responsible for commit/rollback.
     * Returns the new order ID.
     */
    public function createWithinTransaction(PDO $pdo, int $userId, array $items): int {
        $resolvedItems = [];

        foreach ($items as $item) {
            $stmt = $pdo->prepare(
                "SELECT id, price, stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE"
            );
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new RuntimeException("Product {$item['product_id']} not found or inactive");
            }

            $qty = (int) $item['quantity'];
            if ($qty < 1) {
                throw new RuntimeException("Invalid quantity for product {$item['product_id']}");
            }
            if ($product['stock'] < $qty) {
                throw new RuntimeException("Insufficient stock for product {$item['product_id']}");
            }

            $resolvedItems[] = [
                'product_id' => $product['id'],
                'quantity'   => $qty,
                'unit_price' => (float) $product['price'],
                'total'      => $product['price'] * $qty,
            ];
        }

        $totalPrice = array_sum(array_column($resolvedItems, 'total'));

        $stmt = $pdo->prepare(
            "INSERT INTO orders (user_id, total_price, status, created_at, updated_at)
             VALUES (?, ?, 'pending', NOW(), NOW())"
        );
        $stmt->execute([$userId, $totalPrice]);
        $orderId = (int) $pdo->lastInsertId();

        foreach ($resolvedItems as $item) {
            $pdo->prepare(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at, updated_at)
                 VALUES (?, ?, ?, ?, NOW(), NOW())"
            )->execute([$orderId, $item['product_id'], $item['quantity'], $item['unit_price']]);

            $stmt = $pdo->prepare(
                "UPDATE products SET stock = stock - ?, updated_at = NOW()
                 WHERE id = ? AND stock >= ?"
            );
            $stmt->execute([$item['quantity'], $item['product_id'], $item['quantity']]);
            if ($stmt->rowCount() === 0) {
                throw new RuntimeException("Concurrent stock conflict for product {$item['product_id']}");
            }
        }

        return $orderId;
    }

    public function findById(int $id, ?int $userId = null): ?array {
        $sql = "SELECT o.*, u.username, u.email
                FROM orders o
                JOIN users u ON u.id = o.user_id
                WHERE o.id = ?";
        $params = [$id];
        if ($userId !== null) {
            $sql .= " AND o.user_id = ?";
            $params[] = $userId;
        }
        $stmt = $this->pdo->prepare($sql . " LIMIT 1");
        $stmt->execute($params);
        $order = $stmt->fetch();
        if (!$order) {
            return null;
        }
        $order['items'] = $this->getItems((int) $order['id']);
        return $order;
    }

    public function getItems(int $orderId): array {
        $stmt = $this->pdo->prepare(
            "SELECT oi.*, p.name AS product_name, p.image_url
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?"
        );
        $stmt->execute([$orderId]);
        return $stmt->fetchAll();
    }

    public function getByUser(int $userId, int $page = 1, int $perPage = 20): array {
        $offset = ($page - 1) * $perPage;
        $stmt = $this->pdo->prepare(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->execute([$userId, $perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function countByUser(int $userId): int {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    public function getAll(int $page = 1, int $perPage = 20, string $status = ''): array {
        $offset = ($page - 1) * $perPage;
        $where = '';
        $params = [];

        if ($status !== '') {
            $where = 'WHERE o.status = ?';
            $params[] = $status;
        }
        $params[] = $perPage;
        $params[] = $offset;

        $stmt = $this->pdo->prepare(
            "SELECT o.*, u.username, u.email
             FROM orders o
             JOIN users u ON u.id = o.user_id
             $where
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function countAll(string $status = ''): int {
        if ($status !== '') {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM orders WHERE status = ?");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM orders");
        }
        return (int) $stmt->fetchColumn();
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->pdo->prepare("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    public function totalSales(): float {
        return (float) $this->pdo->query(
            "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed'"
        )->fetchColumn();
    }

    public function salesLast7Days(): array {
        $stmt = $this->pdo->query(
            "SELECT DATE(created_at) AS date, COALESCE(SUM(total_price), 0) AS total
             FROM orders
             WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC"
        );
        return $stmt->fetchAll();
    }
}
