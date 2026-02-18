import { useEffect, useState, useCallback } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import api from '../../api/axios'
import { FiEye } from 'react-icons/fi'

const statusOptions = ['', 'pending', 'completed', 'cancelled', 'refunded']
const statusMap = { pending: ['#d97706', '#fffbeb', 'รอดำเนินการ'], completed: ['#16a34a', '#f0fdf4', 'สำเร็จ'], cancelled: ['#dc2626', '#fef2f2', 'ยกเลิก'], refunded: ['#6b7280', '#f9fafb', 'คืนเงิน'] }

function StatusBadge({ status }) {
  const [color, bg, label] = statusMap[status] || ['#6b7280', '#f9fafb', status]
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{label}</span>
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updating, setUpdating] = useState(false)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (statusFilter) params.status = statusFilter
    api.get('/admin/orders', { params }).then((res) => {
      const d = res.data
      if (Array.isArray(d)) { setOrders(d); setTotalPages(1) }
      else { setOrders(d?.data || d?.items || []); setTotalPages(d?.total_pages || 1) }
    }).catch(() => setOrders([])).finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = async (id, status) => {
    setUpdating(true)
    try { await api.put(`/admin/orders/${id}`, { status }); fetch(); if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status }) }
    catch {} finally { setUpdating(false) }
  }

  const refund = async (id) => {
    try { await api.post(`/admin/orders/${id}/refund`); fetch() } catch {}
  }

  const thS = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>จัดการคำสั่งซื้อ</h1>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}>
            <option value="">ทุกสถานะ</option>
            {statusOptions.filter(Boolean).map((s) => <option key={s} value={s}>{statusMap[s]?.[2] || s}</option>)}
          </select>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thS}>รหัส</th><th style={thS}>ผู้ใช้</th><th style={thS}>จำนวนเงิน</th>
                <th style={thS}>สถานะ</th><th style={thS}>วันที่</th><th style={thS}>Actions</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>#{o.id}</td>
                    <td style={tdS}>{o.username || o.user?.username || '-'}</td>
                    <td style={{ ...tdS, color: '#dc2626', fontWeight: 700 }}>฿{Number(o.total_amount ?? o.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td style={tdS}><StatusBadge status={o.status} /></td>
                    <td style={{ ...tdS, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelectedOrder(o)} style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#2563eb', fontSize: 12 }}><FiEye size={13} /></button>
                        {o.status === 'completed' && (
                          <button onClick={() => refund(o.id)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>คืนเงิน</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← ก่อนหน้า</button>
            <span style={{ padding: '7px 14px', fontSize: 13, color: '#6b7280' }}>หน้า {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>ถัดไป →</button>
          </div>
        )}
      </main>

      {selectedOrder && (
        <Modal title={`คำสั่งซื้อ #${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>ผู้ใช้: <strong>{selectedOrder.username || selectedOrder.user?.username}</strong></div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>วันที่: {new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}</div>
            <div style={{ marginBottom: 8 }}>สถานะ: <StatusBadge status={selectedOrder.status} /></div>
          </div>
          {selectedOrder.items?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                  <span>{item.product_name}</span>
                  <span style={{ color: '#6b7280' }}>x{item.quantity} = ฿{Number(item.price * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 16, marginBottom: 16, textAlign: 'right' }}>
            รวม: ฿{Number(selectedOrder.total_amount ?? selectedOrder.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>เปลี่ยนสถานะ:</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statusOptions.filter(Boolean).map((s) => (
              <button key={s} onClick={() => updateStatus(selectedOrder.id, s)} disabled={updating || selectedOrder.status === s}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: updating || selectedOrder.status === s ? 'not-allowed' : 'pointer',
                  background: selectedOrder.status === s ? '#f3f4f6' : '#fff', fontSize: 12, fontWeight: 600,
                  color: statusMap[s]?.[0] || '#374151', opacity: selectedOrder.status === s ? 0.6 : 1,
                }}>{statusMap[s]?.[2] || s}</button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
