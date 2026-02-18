<?php

require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../config/config.php';

class ProductController {

    private Product $productModel;

    public function __construct() {
        $this->productModel = new Product();
    }

    // GET /products
    public function index(): void {
        $page       = max(1, (int) ($_GET['page'] ?? 1));
        $perPage    = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));
        $categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : null;
        $search     = trim($_GET['search'] ?? '');

        $products = $this->productModel->getAll($page, $perPage, $categoryId, $search);
        $total    = $this->productModel->count($categoryId, $search);

        Response::paginated($products, $total, $page, $perPage);
    }

    // GET /products/{id}
    public function show(int $id): void {
        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }
        Response::success($product);
    }

    // POST /admin/products
    public function store(): void {
        AdminMiddleware::handle();
        $body = $this->getBody();

        $errors = [];
        if (empty($body['name'])) {
            $errors['name'] = 'Name is required.';
        }
        if (!isset($body['price']) || !is_numeric($body['price']) || $body['price'] < 0) {
            $errors['price'] = 'A valid price is required.';
        }
        if (!isset($body['category_id']) || !is_numeric($body['category_id'])) {
            $errors['category_id'] = 'category_id is required.';
        }
        if (!empty($errors)) {
            Response::error('Validation failed', 422, $errors);
        }

        $id      = $this->productModel->create($body);
        $product = $this->productModel->findById($id);
        Response::success($product, 'Product created', 201);
    }

    // PUT /admin/products/{id}
    public function update(int $id): void {
        AdminMiddleware::handle();
        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }
        $body = $this->getBody();
        $this->productModel->update($id, $body);
        $updated = $this->productModel->findById($id);
        Response::success($updated, 'Product updated');
    }

    // DELETE /admin/products/{id}
    public function destroy(int $id): void {
        AdminMiddleware::handle();
        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }
        $this->productModel->delete($id);
        Response::success(null, 'Product deleted');
    }

    // POST /admin/products/{id}/upload-image
    public function uploadImage(int $id): void {
        AdminMiddleware::handle();
        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Image file is required', 422);
        }

        $file = $_FILES['image'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, ALLOWED_IMAGE_TYPES, true)) {
            Response::error('Invalid image type. Allowed: jpeg, png, gif, webp', 422);
        }
        if ($file['size'] > MAX_IMAGE_SIZE) {
            Response::error('Image size must not exceed 5 MB', 422);
        }

        $ext       = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename  = 'product_' . $id . '_' . time() . '.' . $ext;
        $uploadDir = UPLOAD_DIR . 'products/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            Response::error('Failed to save image', 500);
        }

        $imageUrl = BASE_URL . '/uploads/products/' . $filename;
        $this->productModel->update($id, ['image_url' => $imageUrl]);

        Response::success(['image_url' => $imageUrl], 'Image uploaded');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
