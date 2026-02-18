import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api/axios'

const statColors = { blue: '#2563eb', green: '#16a34a', orange: '#d97706', red: '#dc2626' }

function StatCard({ label, value, color, prefix = '' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${statColors[color] || color}`, flex: 1,
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: statColors[color] || color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('th-TH') : (value ?? '—')}
      </div>
    </div>
  )
}

function statusBadge(status) {
  const map = {
    pending: ['#d97706', '#fffbeb', 'รอดำเนินการ'],
    completed: ['#16a34a', '#f0fdf4', 'สำเร็จ'],
    cancelled: ['#dc2626', '#fef2f2', 'ยกเลิก'],
    refunded: ['#6b7280', '#f9fafb', 'คืนเงินแล้ว'],
  }
  const [color, bg, label] = map[status] || ['#6b7280', '#f9fafb', status]
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>
      {label}
    </span>
  )
}

export default function Dashboard() {
  const [announcement, setAnnouncement] = useState(null)
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/announcements?active=true'),
      api.get('/dashboard/stats'),
      api.get('/orders?limit=5'),
    ]).then(([annRes, statsRes, ordersRes]) => {
      if (annRes.status === 'fulfilled') {
        const list = annRes.value.data
        if (Array.isArray(list) && list.length) setAnnouncement(list[0])
        else if (list?.data?.length) setAnnouncement(list.data[0])
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value.data
        setOrders(Array.isArray(d) ? d : (d?.data || d?.items || []))
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <><Navbar /><LoadingSpinner /></>

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {announcement && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
            padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>📢</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{announcement.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{announcement.content}</div>
            </div>
          </div>
        )}

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>หน้าหลัก</h1>

        {stats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <StatCard label="ผู้ใช้ทั้งหมด" value={stats.total_users} color="blue" />
            <StatCard label="สินค้าทั้งหมด" value={stats.total_products} color="green" />
            <StatCard label="สต็อกรวม" value={stats.total_stock} color="orange" />
            <StatCard label="ยอดขายรวม" value={stats.total_sales} color="red" prefix="฿" />
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>คำสั่งซื้อล่าสุด</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px 0' }}>ยังไม่มีคำสั่งซื้อ</div>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {orders.map((order) => (
                <div key={order.id} style={{
                  border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
                  minWidth: 200, flex: '1 0 200px', maxWidth: 260,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {order.product_name || order.items?.[0]?.product_name || `คำสั่งซื้อ #${order.id}`}
                  </div>
                  {order.quantity && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>จำนวน: {order.quantity}</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', margin: '6px 0' }}>
                    ฿{Number(order.total_amount ?? order.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {statusBadge(order.status)}
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(order.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
