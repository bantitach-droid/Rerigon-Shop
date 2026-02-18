import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/axios'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/admin/users').then((res) => {
      const d = res.data
      setUsers(Array.isArray(d) ? d : (d?.data || d?.users || []))
    }).catch(() => setUsers([])).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const update = async (id, data) => {
    setUpdating(id)
    try { await api.put(`/admin/users/${id}`, data); fetch() }
    catch {} finally { setUpdating(null) }
  }

  const thS = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>จัดการผู้ใช้</h1>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thS}>#</th><th style={thS}>ชื่อ</th><th style={thS}>อีเมล</th>
                <th style={thS}>บทบาท</th><th style={thS}>ยอดเงิน</th><th style={thS}>สถานะ</th><th style={thS}>Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>{i + 1}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{u.username}</td>
                    <td style={{ ...tdS, color: '#6b7280' }}>{u.email}</td>
                    <td style={tdS}>
                      <span style={{
                        background: u.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                        color: u.role === 'admin' ? '#dc2626' : '#16a34a',
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      }}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                    </td>
                    <td style={{ ...tdS, color: '#dc2626', fontWeight: 700 }}>฿{Number(u.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td style={tdS}>
                      <span style={{
                        background: u.is_active !== false ? '#f0fdf4' : '#fef2f2',
                        color: u.is_active !== false ? '#16a34a' : '#dc2626',
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      }}>{u.is_active !== false ? 'ใช้งาน' : 'ระงับ'}</span>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => update(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                          disabled={updating === u.id}
                          style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                        >{u.role === 'admin' ? 'ลด Admin' : 'เป็น Admin'}</button>
                        <button
                          onClick={() => update(u.id, { is_active: u.is_active === false ? true : false })}
                          disabled={updating === u.id}
                          style={{
                            background: u.is_active !== false ? '#fef2f2' : '#f0fdf4',
                            color: u.is_active !== false ? '#dc2626' : '#16a34a',
                            border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          }}
                        >{u.is_active !== false ? 'ระงับ' : 'เปิดใช้'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
