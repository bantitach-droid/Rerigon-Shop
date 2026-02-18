import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ label, value, color, prefix = '' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${color}`, flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{prefix}{typeof value === 'number' ? value.toLocaleString('th-TH') : (value ?? '—')}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/stats/sales'),
      api.get('/admin/stats/users'),
    ]).then(([sRes, salRes, usrRes]) => {
      if (sRes.status === 'fulfilled') setStats(sRes.value.data)
      if (salRes.status === 'fulfilled') {
        const d = salRes.value.data
        setSalesData(Array.isArray(d) ? d : (d?.data || []))
      }
      if (usrRes.status === 'fulfilled') {
        const d = usrRes.value.data
        setUsersData(Array.isArray(d) ? d : (d?.data || []))
      }
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Admin Dashboard</h1>
        {loading ? <LoadingSpinner /> : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
              <StatCard label="ผู้ใช้ทั้งหมด" value={stats?.total_users ?? 0} color="#2563eb" />
              <StatCard label="สินค้าทั้งหมด" value={stats?.total_products ?? 0} color="#16a34a" />
              <StatCard label="คำสั่งซื้อ" value={stats?.total_orders ?? 0} color="#d97706" />
              <StatCard label="ยอดขายรวม" value={stats?.total_revenue ?? stats?.total_sales ?? 0} color="#dc2626" prefix="฿" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>ยอดขาย 7 วันล่าสุด</h3>
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#dc2626" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>ไม่มีข้อมูล</div>}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>ผู้ใช้ใหม่ 7 วันล่าสุด</h3>
                {usersData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={usersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>ไม่มีข้อมูล</div>}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
