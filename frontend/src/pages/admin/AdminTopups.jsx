import { useEffect, useState, useCallback } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/axios'

const methodLabels = { promptpay: 'PromptPay', bank_transfer: 'โอนธนาคาร', truemoney: 'TrueMoney', linepay: 'Line Pay' }
const statusMap = { pending: ['#d97706', '#fffbeb', 'รอดำเนินการ'], approved: ['#16a34a', '#f0fdf4', 'อนุมัติแล้ว'], rejected: ['#dc2626', '#fef2f2', 'ถูกปฏิเสธ'] }

function StatusBadge({ status }) {
  const [color, bg, label] = statusMap[status] || ['#6b7280', '#f9fafb', status]
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{label}</span>
}

export default function AdminTopups() {
  const [topups, setTopups] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updating, setUpdating] = useState(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (statusFilter) params.status = statusFilter
    api.get('/admin/topups', { params }).then((res) => {
      const d = res.data
      if (Array.isArray(d)) { setTopups(d); setTotalPages(1) }
      else { setTopups(d?.data || d?.items || []); setTotalPages(d?.total_pages || 1) }
    }).catch(() => setTopups([])).finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try { await api.put(`/admin/topups/${id}`, { status }); fetch() }
    catch {} finally { setUpdating(null) }
  }

  const thS = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>จัดการการเติมเงิน</h1>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}>
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ถูกปฏิเสธ</option>
          </select>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : topups.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>ไม่มีรายการ</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thS}>ผู้ใช้</th><th style={thS}>จำนวน</th><th style={thS}>ช่องทาง</th>
                <th style={thS}>สถานะ</th><th style={thS}>วันที่</th><th style={thS}>Actions</th>
              </tr></thead>
              <tbody>
                {topups.map((t) => (
                  <tr key={t.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>{t.username || t.user?.username || '-'}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: '#dc2626' }}>฿{Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td style={tdS}>{methodLabels[t.payment_method] || t.payment_method}</td>
                    <td style={tdS}><StatusBadge status={t.status} /></td>
                    <td style={{ ...tdS, color: '#6b7280' }}>{new Date(t.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={tdS}>
                      {t.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => updateStatus(t.id, 'approved')} disabled={updating === t.id}
                            style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          >อนุมัติ</button>
                          <button
                            onClick={() => updateStatus(t.id, 'rejected')} disabled={updating === t.id}
                            style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          >ปฏิเสธ</button>
                        </div>
                      )}
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
    </div>
  )
}
