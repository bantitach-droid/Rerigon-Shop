import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import api from '../api/axios'

function statusBadge(status) {
  const map = {
    pending: ['#d97706', '#fffbeb', 'รอดำเนินการ'],
    completed: ['#16a34a', '#f0fdf4', 'สำเร็จ'],
    cancelled: ['#dc2626', '#fef2f2', 'ยกเลิก'],
    refunded: ['#6b7280', '#f9fafb', 'คืนเงินแล้ว'],
  }
  const [color, bg, label] = map[status] || ['#6b7280', '#f9fafb', status]
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{label}</span>
}

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/orders', { params: { page, limit: 10 } }).then((res) => {
      const d = res.data
      if (Array.isArray(d)) { setOrders(d); setTotalPages(1) }
      else { setOrders(d?.data || d?.items || []); setTotalPages(d?.total_pages || 1) }
    }).catch(() => setOrders([])).finally(() => setLoading(false))
  }, [page])

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdStyle = { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>ประวัติการสั่งซื้อ</h1>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : orders.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>ยังไม่มีประวัติการสั่งซื้อ</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ชื่อสินค้า</th>
                  <th style={thStyle}>จำนวน</th>
                  <th style={thStyle}>ราคา</th>
                  <th style={thStyle}>สถานะ</th>
                  <th style={thStyle}>วันที่</th>
                  <th style={thStyle}>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{o.product_name || o.items?.[0]?.product_name || `#${o.id}`}</td>
                    <td style={tdStyle}>{o.quantity ?? o.items?.reduce((s, i) => s + i.quantity, 0) ?? '-'}</td>
                    <td style={{ ...tdStyle, color: '#dc2626', fontWeight: 700 }}>
                      ฿{Number(o.total_amount ?? o.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={tdStyle}>{statusBadge(o.status)}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                      >ดูรายละเอียด</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: page === 1 ? '#f9fafb' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#9ca3af' : '#374151' }}>
              ← ก่อนหน้า
            </button>
            <span style={{ padding: '8px 16px', fontSize: 14, color: '#6b7280' }}>หน้า {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: page === totalPages ? '#f9fafb' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#9ca3af' : '#374151' }}>
              ถัดไป →
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <Modal title={`รายละเอียดคำสั่งซื้อ #${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>สถานะ: </span>
              {statusBadge(selectedOrder.status)}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              วันที่: {new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}
            </div>
            {selectedOrder.items?.length > 0 ? (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>รายการสินค้า:</div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span>{item.product_name}</span>
                    <span style={{ color: '#6b7280' }}>x{item.quantity} = ฿{Number(item.price * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.product_name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>จำนวน: {selectedOrder.quantity}</div>
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>
              รวม: ฿{Number(selectedOrder.total_amount ?? selectedOrder.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
