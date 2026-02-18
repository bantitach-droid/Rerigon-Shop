import { Link, useLocation } from 'react-router-dom'
import {
  FiGrid, FiPackage, FiTag, FiShoppingCart,
  FiDollarSign, FiUsers, FiBell, FiShoppingBag, FiArrowLeft,
} from 'react-icons/fi'

const items = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/products', label: 'จัดการสินค้า', icon: FiPackage },
  { to: '/admin/categories', label: 'จัดการหมวดหมู่', icon: FiTag },
  { to: '/admin/orders', label: 'จัดการคำสั่งซื้อ', icon: FiShoppingCart },
  { to: '/admin/topups', label: 'จัดการการเติมเงิน', icon: FiDollarSign },
  { to: '/admin/users', label: 'จัดการผู้ใช้', icon: FiUsers },
  { to: '/admin/announcements', label: 'จัดการประกาศ', icon: FiBell },
]

export default function AdminSidebar() {
  const location = useLocation()

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: 260, height: '100vh',
      background: '#fff', borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <FiShoppingBag size={20} color="#dc2626" />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#dc2626' }}>Rerigon Shop</span>
        </Link>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, marginLeft: 28 }}>Admin Panel</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {items.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(to)
          return (
            <Link
              key={to} to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                background: isActive ? '#fef2f2' : 'transparent',
                color: isActive ? '#dc2626' : '#374151',
                textDecoration: 'none', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 12px', borderTop: '1px solid #e5e7eb' }}>
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 8, fontSize: 13, color: '#6b7280', textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FiArrowLeft size={15} /> กลับสู่เว็บไซต์
        </Link>
      </div>
    </aside>
  )
}
