import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api/axios'

function statusBadge(status) {
  const map = {
    pending: ['#d97706', '#fffbeb', 'รอดำเนินการ'],
    approved: ['#16a34a', '#f0fdf4', 'อนุมัติแล้ว'],
    rejected: ['#dc2626', '#fef2f2', 'ถูกปฏิเสธ'],
  }
  const [color, bg, label] = map[status] || ['#6b7280', '#f9fafb', status]
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{label}</span>
}

const methodLabels = {
  promptpay: 'PromptPay',
  bank_transfer: 'โอนธนาคาร',
  truemoney: 'TrueMoney',
  linepay: 'Line Pay',
}

export default function TopupHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/topup/history', { params: { page, limit: 10 } }).then((res) => {
      const d = res.data
      if (Array.isArray(d)) { setHistory(d); setTotalPages(1) }
      else { setHistory(d?.data || d?.items || []); setTotalPages(d?.total_pages || 1) }
    }).catch(() => setHistory([])).finally(() => setLoading(false))
  }, [page])

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdStyle = { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>ประวัติการเติมเงิน</h1>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : history.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>ยังไม่มีประวัติการเติมเงิน</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ช่องทาง</th>
                  <th style={thStyle}>จำนวนเงิน</th>
                  <th style={thStyle}>ค่าธรรมเนียม</th>
                  <th style={thStyle}>วันเวลา</th>
                  <th style={thStyle}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>{methodLabels[h.payment_method] || h.payment_method}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#dc2626' }}>
                      ฿{Number(h.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={tdStyle}>{h.fee != null ? `฿${Number(h.fee).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{new Date(h.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={tdStyle}>{statusBadge(h.status)}</td>
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
    </div>
  )
}
