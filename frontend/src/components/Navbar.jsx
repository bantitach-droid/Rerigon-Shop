import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingBag, FiDollarSign, FiUser, FiChevronDown, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, balance, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setDropdownOpen(false)
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{ color: '#374151', fontWeight: 500, fontSize: 14, padding: '8px 12px', borderRadius: 6, transition: 'background 0.2s' }}
      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
      onMouseLeave={(e) => e.target.style.background = 'transparent'}
    >{label}</Link>
  )

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100, background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '0 24px',
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <FiShoppingBag size={22} color="#dc2626" />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#dc2626' }}>Rerigon Shop</span>
        </Link>
        {navLink('/', 'หน้าหลัก')}
        {navLink('/products', 'สินค้า')}
        {isAuthenticated && navLink('/topup', 'เติมเงิน')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isAuthenticated ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fef2f2', borderRadius: 20, padding: '6px 14px',
            }}>
              <FiDollarSign size={14} color="#dc2626" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                ฿{Number(balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 12px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                <FiUser size={15} />
                <span>{user?.username}</span>
                <FiChevronDown size={13} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, zIndex: 200,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
                    {user?.email}
                  </div>
                  {[
                    ['/profile', 'โปรไฟล์'],
                    ['/topup/history', 'ประวัติการเติมเงิน'],
                    ['/orders', 'ประวัติการสั่งซื้อ'],
                  ].map(([to, label]) => (
                    <Link
                      key={to} to={to}
                      onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: '#374151', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >{label}</Link>
                  ))}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: '#dc2626', fontWeight: 600, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >Admin Panel</Link>
                  )}
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 10px', background: 'none', border: 'none',
                        color: '#dc2626', fontSize: 14, cursor: 'pointer', borderRadius: 6,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiLogOut size={15} /> ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
              fontSize: 14, fontWeight: 500, color: '#374151',
            }}>เข้าสู่ระบบ</Link>
            <Link to="/register" style={{
              padding: '8px 16px', borderRadius: 8, background: '#dc2626',
              fontSize: 14, fontWeight: 600, color: '#fff',
            }}>สมัครสมาชิก</Link>
          </>
        )}
      </div>
    </nav>
  )
}
