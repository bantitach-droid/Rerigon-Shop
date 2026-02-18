<?php

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/middleware/RateLimitMiddleware.php';

// ─── CORS Headers ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
RateLimitMiddleware::handle();

// ─── Router ───────────────────────────────────────────────────────────────────
$requestUri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Strip /api prefix and normalize
$path = preg_replace('#^/api#', '', $requestUri);
$path = rtrim($path, '/') ?: '/';
$segments = explode('/', ltrim($path, '/'));

// Helper to extract integer segment
function seg(array $segments, int $index): ?int {
    return isset($segments[$index]) && ctype_digit((string)$segments[$index])
        ? (int)$segments[$index]
        : null;
}

try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    if ($segments[0] === 'auth') {
        require_once __DIR__ . '/controllers/AuthController.php';
        $c = new AuthController();
        match ([$requestMethod, $segments[1] ?? '']) {
            ['POST', 'register'] => $c->register(),
            ['POST', 'login']    => $c->login(),
            ['POST', 'logout']   => $c->logout(),
            default              => Response::error('Route not found', 404),
        };
    }

    // ── User (authenticated) ──────────────────────────────────────────────────
    elseif ($segments[0] === 'user') {
        require_once __DIR__ . '/controllers/UserController.php';
        $c = new UserController();
        match ([$requestMethod, $segments[1] ?? '']) {
            ['GET',  'profile']         => $c->profile(),
            ['PUT',  'profile']         => $c->updateProfile(),
            ['PUT',  'change-password'] => $c->changePassword(),
            default                     => Response::error('Route not found', 404),
        };
    }

    // ── Products (public GET, admin write) ────────────────────────────────────
    elseif ($segments[0] === 'products') {
        require_once __DIR__ . '/controllers/ProductController.php';
        $c  = new ProductController();
        $id = seg($segments, 1);
        if ($id !== null) {
            match ($requestMethod) {
                'GET' => $c->show($id),
                default => Response::error('Route not found', 404),
            };
        } else {
            match ($requestMethod) {
                'GET' => $c->index(),
                default => Response::error('Route not found', 404),
            };
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────
    elseif ($segments[0] === 'categories') {
        require_once __DIR__ . '/controllers/CategoryController.php';
        $c = new CategoryController();
        match ($requestMethod) {
            'GET' => $c->index(),
            default => Response::error('Route not found', 404),
        };
    }

    // ── Orders (authenticated) ────────────────────────────────────────────────
    elseif ($segments[0] === 'orders') {
        require_once __DIR__ . '/controllers/OrderController.php';
        $c  = new OrderController();
        $id = seg($segments, 1);
        if ($id !== null) {
            match ($requestMethod) {
                'GET' => $c->show($id),
                default => Response::error('Route not found', 404),
            };
        } else {
            match ($requestMethod) {
                'GET'  => $c->index(),
                'POST' => $c->store(),
                default => Response::error('Route not found', 404),
            };
        }
    }

    // ── Topup (authenticated) ─────────────────────────────────────────────────
    elseif ($segments[0] === 'topup') {
        require_once __DIR__ . '/controllers/TopupController.php';
        $c = new TopupController();
        if (($segments[1] ?? '') === 'history') {
            match ($requestMethod) {
                'GET' => $c->history(),
                default => Response::error('Route not found', 404),
            };
        } else {
            match ($requestMethod) {
                'POST' => $c->store(),
                default => Response::error('Route not found', 404),
            };
        }
    }

    // ── User Dashboard ────────────────────────────────────────────────────────
    elseif ($segments[0] === 'dashboard') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        $c = new DashboardController();
        if (($segments[1] ?? '') === 'stats') {
            match ($requestMethod) {
                'GET' => $c->stats(),
                default => Response::error('Route not found', 404),
            };
        } else {
            Response::error('Route not found', 404);
        }
    }

    // ── Announcements (public) ────────────────────────────────────────────────
    elseif ($segments[0] === 'announcements') {
        require_once __DIR__ . '/controllers/AdminController.php';
        $c = new AdminController();
        match ($requestMethod) {
            'GET' => $c->listAnnouncements(),
            default => Response::error('Route not found', 404),
        };
    }

    // ── Admin Routes ──────────────────────────────────────────────────────────
    elseif ($segments[0] === 'admin') {
        $resource = $segments[1] ?? '';

        // Admin Products
        if ($resource === 'products') {
            require_once __DIR__ . '/controllers/ProductController.php';
            $c      = new ProductController();
            $id     = seg($segments, 2);
            $action = $segments[3] ?? '';

            if ($id !== null && $action === 'upload-image') {
                match ($requestMethod) {
                    'POST' => $c->uploadImage($id),
                    default => Response::error('Route not found', 404),
                };
            } elseif ($id !== null) {
                match ($requestMethod) {
                    'PUT'    => $c->update($id),
                    'DELETE' => $c->destroy($id),
                    default  => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'POST' => $c->store(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        // Admin Categories
        elseif ($resource === 'categories') {
            require_once __DIR__ . '/controllers/CategoryController.php';
            $c  = new CategoryController();
            $id = seg($segments, 2);
            if ($id !== null) {
                match ($requestMethod) {
                    'PUT'    => $c->update($id),
                    'DELETE' => $c->destroy($id),
                    default  => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'POST' => $c->store(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        // Admin Orders
        elseif ($resource === 'orders') {
            require_once __DIR__ . '/controllers/OrderController.php';
            $c      = new OrderController();
            $id     = seg($segments, 2);
            $action = $segments[3] ?? '';

            if ($id !== null && $action === 'status') {
                match ($requestMethod) {
                    'PUT' => $c->updateStatus($id),
                    default => Response::error('Route not found', 404),
                };
            } elseif ($id !== null && $action === 'refund') {
                match ($requestMethod) {
                    'POST' => $c->refund($id),
                    default => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'GET' => $c->adminIndex(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        // Admin Topup
        elseif ($resource === 'topup') {
            require_once __DIR__ . '/controllers/TopupController.php';
            $c      = new TopupController();
            $id     = seg($segments, 2);
            $action = $segments[3] ?? '';

            if ($id !== null && $action === 'approve') {
                match ($requestMethod) {
                    'PUT' => $c->approve($id),
                    default => Response::error('Route not found', 404),
                };
            } elseif ($id !== null && $action === 'reject') {
                match ($requestMethod) {
                    'PUT' => $c->reject($id),
                    default => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'GET' => $c->adminIndex(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        // Admin Dashboard
        elseif ($resource === 'dashboard') {
            require_once __DIR__ . '/controllers/AdminController.php';
            $c      = new AdminController();
            $action = $segments[2] ?? '';
            match ([$requestMethod, $action]) {
                ['GET', 'stats']       => $c->dashboardStats(),
                ['GET', 'sales-chart'] => $c->salesChart(),
                ['GET', 'users-chart'] => $c->usersChart(),
                default                => Response::error('Route not found', 404),
            };
        }

        // Admin Users
        elseif ($resource === 'users') {
            require_once __DIR__ . '/controllers/AdminController.php';
            $c      = new AdminController();
            $id     = seg($segments, 2);
            $action = $segments[3] ?? '';

            if ($id !== null && $action === 'role') {
                match ($requestMethod) {
                    'PUT' => $c->updateUserRole($id),
                    default => Response::error('Route not found', 404),
                };
            } elseif ($id !== null && $action === 'ban') {
                match ($requestMethod) {
                    'PUT' => $c->banUser($id),
                    default => Response::error('Route not found', 404),
                };
            } elseif ($id !== null && $action === 'unban') {
                match ($requestMethod) {
                    'PUT' => $c->unbanUser($id),
                    default => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'GET' => $c->listUsers(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        // Admin Announcements
        elseif ($resource === 'announcements') {
            require_once __DIR__ . '/controllers/AdminController.php';
            $c  = new AdminController();
            $id = seg($segments, 2);
            if ($id !== null) {
                match ($requestMethod) {
                    'PUT'    => $c->updateAnnouncement($id),
                    'DELETE' => $c->deleteAnnouncement($id),
                    default  => Response::error('Route not found', 404),
                };
            } else {
                match ($requestMethod) {
                    'POST' => $c->createAnnouncement(),
                    default => Response::error('Route not found', 404),
                };
            }
        }

        else {
            Response::error('Route not found', 404);
        }
    }

    else {
        Response::error('Route not found', 404);
    }

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    Response::error('A database error occurred', 500);
} catch (Throwable $e) {
    error_log('Unhandled error: ' . $e->getMessage());
    Response::error('An internal server error occurred', 500);
}
