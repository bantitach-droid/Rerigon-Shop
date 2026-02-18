<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/Announcement.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../config/database.php';

class AdminController {

    private User         $userModel;
    private Product      $productModel;
    private Order        $orderModel;
    private Announcement $announcementModel;

    public function __construct() {
        $this->userModel         = new User();
        $this->productModel      = new Product();
        $this->orderModel        = new Order();
        $this->announcementModel = new Announcement();
    }

    // -------------------------------------------------------------------------
    // Admin Dashboard
    // -------------------------------------------------------------------------

    // GET /admin/dashboard/stats
    public function dashboardStats(): void {
        AdminMiddleware::handle();

        $pdo = getDBConnection();

        $pendingTopups = (int) $pdo->query(
            "SELECT COUNT(*) FROM topups WHERE status = 'pending'"
        )->fetchColumn();

        $pendingOrders = (int) $pdo->query(
            "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
        )->fetchColumn();

        Response::success([
            'total_users'    => $this->userModel->count(),
            'total_products' => $this->productModel->totalCount(),
            'total_stock'    => $this->productModel->totalStock(),
            'total_sales'    => $this->orderModel->totalSales(),
            'pending_topups' => $pendingTopups,
            'pending_orders' => $pendingOrders,
        ]);
    }

    // GET /admin/dashboard/sales-chart
    public function salesChart(): void {
        AdminMiddleware::handle();

        $data = $this->orderModel->salesLast7Days();

        // Fill in missing days with 0
        $chart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date    = date('Y-m-d', strtotime("-$i days"));
            $found   = array_filter($data, fn($r) => $r['date'] === $date);
            $record  = reset($found);
            $chart[] = [
                'date'  => $date,
                'total' => $record ? (float) $record['total'] : 0.0,
            ];
        }

        Response::success($chart);
    }

    // GET /admin/dashboard/users-chart
    public function usersChart(): void {
        AdminMiddleware::handle();

        $pdo  = getDBConnection();
        $stmt = $pdo->query(
            "SELECT DATE(created_at) AS date, COUNT(*) AS total
             FROM users
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC"
        );
        $data = $stmt->fetchAll();

        $chart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date    = date('Y-m-d', strtotime("-$i days"));
            $found   = array_filter($data, fn($r) => $r['date'] === $date);
            $record  = reset($found);
            $chart[] = [
                'date'  => $date,
                'total' => $record ? (int) $record['total'] : 0,
            ];
        }

        Response::success($chart);
    }

    // -------------------------------------------------------------------------
    // Admin Users
    // -------------------------------------------------------------------------

    // GET /admin/users
    public function listUsers(): void {
        AdminMiddleware::handle();
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $users = $this->userModel->getAll($page, $perPage);
        $total = $this->userModel->count();
        Response::paginated($users, $total, $page, $perPage);
    }

    // PUT /admin/users/{id}/role
    public function updateUserRole(int $id): void {
        AdminMiddleware::handle();
        $body = $this->getBody();
        $role = $body['role'] ?? '';

        if (!in_array($role, ['user', 'admin'], true)) {
            Response::error('Role must be "user" or "admin"', 422);
        }

        $user = $this->userModel->findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }

        $this->userModel->setRole($id, $role);
        Response::success(null, 'User role updated');
    }

    // PUT /admin/users/{id}/ban
    public function banUser(int $id): void {
        AdminMiddleware::handle();
        $user = $this->userModel->findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }
        $this->userModel->setBanned($id, 1);
        Response::success(null, 'User banned');
    }

    // PUT /admin/users/{id}/unban
    public function unbanUser(int $id): void {
        AdminMiddleware::handle();
        $user = $this->userModel->findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }
        $this->userModel->setBanned($id, 0);
        Response::success(null, 'User unbanned');
    }

    // -------------------------------------------------------------------------
    // Admin Announcements
    // -------------------------------------------------------------------------

    // GET /announcements  (public)
    public function listAnnouncements(): void {
        $announcements = $this->announcementModel->getActive();
        Response::success($announcements);
    }

    // POST /admin/announcements
    public function createAnnouncement(): void {
        AdminMiddleware::handle();
        $body = $this->getBody();

        $title   = trim($body['title'] ?? '');
        $content = trim($body['content'] ?? '');
        if (empty($title)) {
            Response::error('Title is required', 422);
        }
        if (empty($content)) {
            Response::error('Content is required', 422);
        }

        $isActive = isset($body['is_active']) ? (int) $body['is_active'] : 1;
        $id       = $this->announcementModel->create($title, $content, $isActive);
        $ann      = $this->announcementModel->findById($id);
        Response::success($ann, 'Announcement created', 201);
    }

    // PUT /admin/announcements/{id}
    public function updateAnnouncement(int $id): void {
        AdminMiddleware::handle();
        $ann = $this->announcementModel->findById($id);
        if (!$ann) {
            Response::error('Announcement not found', 404);
        }
        $body = $this->getBody();
        $this->announcementModel->update($id, $body);
        $updated = $this->announcementModel->findById($id);
        Response::success($updated, 'Announcement updated');
    }

    // DELETE /admin/announcements/{id}
    public function deleteAnnouncement(int $id): void {
        AdminMiddleware::handle();
        $ann = $this->announcementModel->findById($id);
        if (!$ann) {
            Response::error('Announcement not found', 404);
        }
        $this->announcementModel->delete($id);
        Response::success(null, 'Announcement deleted');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
