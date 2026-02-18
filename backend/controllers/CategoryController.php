<?php

require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';

class CategoryController {

    private Category $categoryModel;

    public function __construct() {
        $this->categoryModel = new Category();
    }

    // GET /categories
    public function index(): void {
        $categories = $this->categoryModel->getAll();
        Response::success($categories);
    }

    // POST /admin/categories
    public function store(): void {
        AdminMiddleware::handle();
        $body = $this->getBody();

        $name = trim($body['name'] ?? '');
        if (empty($name)) {
            Response::error('Category name is required', 422);
        }

        $id       = $this->categoryModel->create($name, $body['description'] ?? '', $body['icon'] ?? '');
        $category = $this->categoryModel->findById($id);
        Response::success($category, 'Category created', 201);
    }

    // PUT /admin/categories/{id}
    public function update(int $id): void {
        AdminMiddleware::handle();
        $category = $this->categoryModel->findById($id);
        if (!$category) {
            Response::error('Category not found', 404);
        }
        $body = $this->getBody();
        $this->categoryModel->update($id, $body);
        $updated = $this->categoryModel->findById($id);
        Response::success($updated, 'Category updated');
    }

    // DELETE /admin/categories/{id}
    public function destroy(int $id): void {
        AdminMiddleware::handle();
        $category = $this->categoryModel->findById($id);
        if (!$category) {
            Response::error('Category not found', 404);
        }
        $this->categoryModel->delete($id);
        Response::success(null, 'Category deleted');
    }

    private function getBody(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
