<?php

require_once __DIR__ . '/../models/Topup.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class TopupController {

    private Topup $topupModel;
    private User  $userModel;

    public function __construct() {
        $this->topupModel = new Topup();
        $this->userModel  = new User();
    }

    // POST /topup
    // Note: when uploading a payment slip, send as multipart/form-data with
    // `amount`, `method`, `fee` as form fields and `slip` as the file field.
    // For topups without a slip, JSON body is also accepted.
    public function store(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        // Support both multipart/form-data (with slip upload) and JSON body
        $isMultipart = isset($_FILES['slip']) || !empty($_POST);
        $body = $isMultipart ? $_POST : $this->getBody();

        $amount = isset($body['amount']) ? (float) $body['amount'] : 0.0;
        $method = trim($body['method'] ?? '');

        if ($amount <= 0) {
            Response::error('Amount must be greater than 0', 422);
        }
        if (empty($method)) {
            Response::error('Payment method is required', 422);
        }

        $fee     = isset($body['fee']) ? (float) $body['fee'] : 0.0;
        $slipUrl = null;

        // Handle optional slip image upload
        if (isset($_FILES['slip']) && $_FILES['slip']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['slip'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, ALLOWED_IMAGE_TYPES, true)) {
                Response::error('Invalid slip image type', 422);
            }
            if ($file['size'] > MAX_IMAGE_SIZE) {
                Response::error('Slip image too large (max 5 MB)', 422);
            }

            $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'slip_' . $userId . '_' . time() . '.' . $ext;
            $dir      = UPLOAD_DIR . 'slips/';
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            if (move_uploaded_file($file['tmp_name'], $dir . $filename)) {
                $slipUrl = BASE_URL . '/uploads/slips/' . $filename;
            }
        }

        $id    = $this->topupModel->create($userId, $amount, $method, $fee, $slipUrl);
        $topup = $this->topupModel->findById($id);
        Response::success($topup, 'Topup request submitted', 201);
    }

    // GET /topup/history
    public function history(): void {
        $payload = AuthMiddleware::handle();
        $userId  = (int) $payload['sub'];
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $history = $this->topupModel->getByUser($userId, $page, $perPage);
        $total   = $this->topupModel->countByUser($userId);
        Response::paginated($history, $total, $page, $perPage);
    }

    // GET /admin/topup
    public function adminIndex(): void {
        AdminMiddleware::handle();
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));
        $status  = $_GET['status'] ?? '';

        $topups = $this->topupModel->getAll($page, $perPage, $status);
        $total  = $this->topupModel->countAll($status);
        Response::paginated($topups, $total, $page, $perPage);
    }

    // PUT /admin/topup/{id}/approve
    public function approve(int $id): void {
        AdminMiddleware::handle();

        $topup = $this->topupModel->findById($id);
        if (!$topup) {
            Response::error('Topup not found', 404);
        }
        if ($topup['status'] !== 'pending') {
            Response::error('Topup is not pending', 409);
        }

        $pdo = getDBConnection();
        $pdo->beginTransaction();
        try {
            $this->topupModel->updateStatus($id, 'approved');
            $this->userModel->updateBalance((int) $topup['user_id'], (float) $topup['amount']);

            $pdo->prepare(
                "INSERT INTO transactions (user_id, type, amount, reference_id, description, created_at, updated_at)
                 VALUES (?, 'topup', ?, ?, ?, NOW(), NOW())"
            )->execute([$topup['user_id'], $topup['amount'], $id, "Topup approved #$id"]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Approval failed: ' . $e->getMessage(), 500);
        }

        Response::success(null, 'Topup approved and balance updated');
    }

    // PUT /admin/topup/{id}/reject
    public function reject(int $id): void {
        AdminMiddleware::handle();

        $topup = $this->topupModel->findById($id);
        if (!$topup) {
            Response::error('Topup not found', 404);
        }
        if ($topup['status'] !== 'pending') {
            Response::error('Topup is not pending', 409);
        }

        $this->topupModel->updateStatus($id, 'rejected');
        Response::success(null, 'Topup rejected');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
