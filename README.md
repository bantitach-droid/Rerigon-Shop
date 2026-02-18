# 🛒 Rerigon Shop

**Rerigon Shop** คือเว็บไซต์ Marketplace สำหรับขายสินค้า Digital พัฒนาด้วย React (Frontend) + PHP REST API (Backend) + MySQL (Database)

---

## 🗂️ โครงสร้างโปรเจกต์

```
Rerigon-Shop/
├── frontend/          # React + Vite application
└── backend/           # PHP REST API
```

---

## ⚙️ เทคโนโลยีที่ใช้

| Layer     | Technology            |
|-----------|-----------------------|
| Frontend  | React 18, Vite, React Router v6, Axios, Recharts, React Icons |
| Backend   | PHP 7.4+, PDO, JWT (manual HS256) |
| Database  | MySQL 5.7+ / MariaDB 10.3+ |
| Security  | bcrypt, Prepared Statements, JWT, Rate Limiting, CORS |

---

## 🚀 การติดตั้ง

### 1. ติดตั้ง Database

```sql
-- นำเข้า schema
mysql -u root -p < backend/database.sql
```

### 2. ติดตั้ง Backend

```bash
cd backend
# แก้ไขการตั้งค่าใน config/database.php
# หรือตั้ง environment variables:
export DB_HOST=localhost
export DB_NAME=rerigon_shop
export DB_USER=root
export DB_PASS=your_password
export JWT_SECRET=your_secret_key

# Start PHP development server
php -S localhost:8000
```

### 3. ติดตั้ง Frontend

```bash
cd frontend
npm install
npm run dev
# เปิดที่ http://localhost:5173
```

---

## 📋 ฟีเจอร์หลัก

### 👤 ฝั่งผู้ใช้ (User Side)
- **Dashboard** - แสดงประกาศ, สถิติ, คำสั่งซื้อล่าสุด
- **สินค้า** - เบราว์สินค้าด้วย Sidebar หมวดหมู่และค้นหา
- **รายละเอียดสินค้า** - ดูรายละเอียด เลือกจำนวน และสั่งซื้อ
- **เติมเงิน** - 4 ช่องทางชำระเงิน พร้อมค่าธรรมเนียม
- **ประวัติการเติมเงิน** - ดูสถานะรายการเติมเงิน
- **ประวัติการสั่งซื้อ** - ดูคำสั่งซื้อทั้งหมด
- **โปรไฟล์** - แก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน

### 🔧 Admin Panel
- **Dashboard** - สถิติรวม, กราฟยอดขาย, กราฟผู้ใช้ใหม่
- **จัดการสินค้า** - เพิ่ม/แก้ไข/ลบสินค้า, อัปโหลดรูป
- **จัดการหมวดหมู่** - CRUD หมวดหมู่
- **จัดการคำสั่งซื้อ** - ดูรายละเอียด, เปลี่ยนสถานะ, คืนเครดิต
- **จัดการการเติมเงิน** - อนุมัติ/ปฏิเสธรายการ
- **จัดการผู้ใช้** - เปลี่ยน Role, แบน/ปลดแบน
- **จัดการประกาศ** - เพิ่ม/แก้ไข/ลบประกาศ

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ (returns JWT) |
| POST | `/api/auth/logout` | ออกจากระบบ |

### User (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | ดูโปรไฟล์ |
| PUT | `/api/user/profile` | แก้ไขโปรไฟล์ |
| PUT | `/api/user/change-password` | เปลี่ยนรหัสผ่าน |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | รายการสินค้า (pagination, filter) |
| GET | `/api/products/{id}` | รายละเอียดสินค้า |
| POST | `/api/admin/products` | เพิ่มสินค้า (admin) |
| PUT | `/api/admin/products/{id}` | แก้ไขสินค้า (admin) |
| DELETE | `/api/admin/products/{id}` | ลบสินค้า (admin) |

### Orders (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | สร้างคำสั่งซื้อ |
| GET | `/api/orders` | ประวัติคำสั่งซื้อ |
| GET | `/api/orders/{id}` | รายละเอียดคำสั่งซื้อ |

### Topup (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/topup` | สร้างรายการเติมเงิน |
| GET | `/api/topup/history` | ประวัติการเติมเงิน |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | สถิติรวม |
| GET | `/api/admin/dashboard/stats` | สถิติ admin |
| GET | `/api/admin/dashboard/sales-chart` | กราฟยอดขาย 7 วัน |
| GET | `/api/admin/dashboard/users-chart` | กราฟผู้ใช้ใหม่ 7 วัน |

---

## 🎨 ดีไซน์

- **โทนสี**: แดง (#dc2626), ขาว, เทา
- **Responsive**: Desktop / Tablet / Mobile
- **Layout**: Card-based, Sidebar navigation
- **ภาษา**: ไทย

---

## 🔒 ความปลอดภัย

- JWT Authentication (HS256)
- bcrypt password hashing
- SQL Injection prevention (Prepared Statements)
- Rate Limiting (100 req/60s per IP)
- CORS protection
- File upload MIME type validation
- Admin middleware

---

## 👤 บัญชี Admin เริ่มต้น

หลังจาก import database.sql:
- Email: `admin@rerigon.shop`
- Password: `Admin@1234`

> ⚠️ **เปลี่ยนรหัสผ่านทันทีหลังติดตั้งใน Production**