-- ============================================================
--  Rerigon Shop – Database Schema
--  Engine: MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `rerigon_shop`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `rerigon_shop`;

-- ─── roles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `roles` (
    `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(50)      NOT NULL,
    `created_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `roles` (`name`) VALUES ('user'), ('admin');

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(100)     NOT NULL,
    `email`      VARCHAR(191)     NOT NULL,
    `password`   VARCHAR(255)     NOT NULL,
    `balance`    DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    `role`       ENUM('user','admin') NOT NULL DEFAULT 'user',
    `is_banned`  TINYINT(1)       NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email`    (`email`),
    UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `categories` (
    `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(100)  NOT NULL,
    `description` VARCHAR(255)  NOT NULL DEFAULT '',
    `icon`        VARCHAR(100)  NOT NULL DEFAULT '',
    `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
    `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `category_id` INT UNSIGNED             DEFAULT NULL,
    `name`        VARCHAR(255)    NOT NULL,
    `description` TEXT                     DEFAULT NULL,
    `price`       DECIMAL(10,2)   NOT NULL,
    `stock`       INT             NOT NULL DEFAULT 0,
    `image_url`   VARCHAR(255)             DEFAULT NULL,
    `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_products_category` (`category_id`),
    KEY `idx_products_active`   (`is_active`),
    CONSTRAINT `fk_products_category`
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `orders` (
    `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`     INT UNSIGNED    NOT NULL,
    `total_price` DECIMAL(10,2)   NOT NULL,
    `status`      ENUM('pending','completed','cancelled','refunded')
                                  NOT NULL DEFAULT 'pending',
    `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_orders_user`   (`user_id`),
    KEY `idx_orders_status` (`status`),
    KEY `idx_orders_status_created` (`status`, `created_at`),
    CONSTRAINT `fk_orders_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── order_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `order_items` (
    `id`         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `order_id`   INT UNSIGNED   NOT NULL,
    `product_id` INT UNSIGNED   NOT NULL,
    `quantity`   INT            NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10,2)  NOT NULL,
    `created_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_order_items_order`   (`order_id`),
    KEY `idx_order_items_product` (`product_id`),
    CONSTRAINT `fk_order_items_order`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_product`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── topups ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `topups` (
    `id`         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED   NOT NULL,
    `amount`     DECIMAL(10,2)  NOT NULL,
    `method`     VARCHAR(100)   NOT NULL,
    `fee`        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    `status`     ENUM('pending','approved','rejected')
                                NOT NULL DEFAULT 'pending',
    `slip_url`   VARCHAR(255)            DEFAULT NULL,
    `created_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_topups_user`   (`user_id`),
    KEY `idx_topups_status` (`status`),
    CONSTRAINT `fk_topups_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transactions` (
    `id`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `user_id`      INT UNSIGNED   NOT NULL,
    `type`         ENUM('topup','purchase','refund')
                                  NOT NULL,
    `amount`       DECIMAL(10,2)  NOT NULL,
    `reference_id` INT UNSIGNED            DEFAULT NULL,
    `description`  TEXT                    DEFAULT NULL,
    `created_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_transactions_user` (`user_id`),
    KEY `idx_transactions_type` (`type`),
    CONSTRAINT `fk_transactions_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── announcements ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `announcements` (
    `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `title`      VARCHAR(255)  NOT NULL,
    `content`    TEXT          NOT NULL,
    `is_active`  TINYINT(1)    NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_announcements_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── rate_limits (used by RateLimitMiddleware) ────────────────
CREATE TABLE IF NOT EXISTS `rate_limits` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `identifier`   VARCHAR(255)  NOT NULL,
    `requests`     INT           NOT NULL DEFAULT 1,
    `window_start` BIGINT        NOT NULL,
    UNIQUE KEY `uq_rate_limits_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed: default admin account ─────────────────────────────
-- !! SECURITY WARNING !!
-- This seed inserts a well-known password hash (password: 'password').
-- You MUST change this password immediately after first login in any
-- non-development environment. Do NOT deploy to production with this hash.
INSERT IGNORE INTO `users` (`username`, `email`, `password`, `role`)
VALUES (
    'admin',
    'admin@rerigon.shop',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
);

-- ─── Seed: sample categories ─────────────────────────────────
INSERT IGNORE INTO `categories` (`id`, `name`, `description`, `icon`) VALUES
(1, 'Game Credits',  'In-game currency and credits', '🎮'),
(2, 'Gift Cards',    'Digital gift cards',            '🎁'),
(3, 'Software Keys', 'License keys and activations',  '🔑'),
(4, 'Subscriptions', 'Streaming and service plans',   '📺');

-- ─── Seed: sample announcements ──────────────────────────────
INSERT IGNORE INTO `announcements` (`title`, `content`, `is_active`) VALUES
('Welcome to Rerigon Shop!', 'Your one-stop destination for digital goods. Browse our catalog and top up your wallet to get started.', 1),
('Instant Delivery', 'All digital products are delivered instantly to your account after payment.', 1);
