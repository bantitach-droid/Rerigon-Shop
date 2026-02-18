import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none',
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState('')
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  useEffect(() => { if (user) setUsername(user.username) }, [user])

  const saveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setProfileMsg({ type: '', text: '' })
    try {
      await api.put('/users/me', { username })
      await refreshUser()
      setProfileMsg({ type: 'success', text: 'บันทึกข้อมูลสำเร็จ' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด' })
    } finally {
      setLoading(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwdMsg({ type: '', text: '' })
    if (pwdForm.new_password !== pwdForm.confirm) {
      setPwdMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
      return
    }
    setPwdLoading(true)
    try {
      await api.put('/users/me/password', { current_password: pwdForm.current_password, new_password: pwdForm.new_password })
      setPwdMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' })
      setPwdForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด' })
    } finally {
      setPwdLoading(false)
    }
  }

  const card = { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }
  const msgStyle = (type) => ({
    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12,
    background: type === 'success' ? '#f0fdf4' : '#fef2f2',
    color: type === 'success' ? '#16a34a' : '#dc2626',
    border: `1px solid ${type === 'success' ? '#86efac' : '#fecaca'}`,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>โปรไฟล์</h1>

        <div style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>ข้อมูลส่วนตัว</h2>
          {profileMsg.text && <div style={msgStyle(profileMsg.type)}>{profileMsg.type === 'success' ? '✓ ' : '✕ '}{profileMsg.text}</div>}
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>ชื่อผู้ใช้</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>อีเมล</label>
              <input value={user?.email || ''} readOnly style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>บทบาท</label>
                <span style={{
                  background: user?.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                  color: user?.role === 'admin' ? '#dc2626' : '#16a34a',
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                }}>{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</span>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>ยอดเงิน</label>
                <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 16 }}>
                  ฿{Number(user?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>บันทึก</button>
          </form>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>เปลี่ยนรหัสผ่าน</h2>
          {pwdMsg.text && <div style={msgStyle(pwdMsg.type)}>{pwdMsg.type === 'success' ? '✓ ' : '✕ '}{pwdMsg.text}</div>}
          <form onSubmit={savePassword}>
            {[
              ['รหัสผ่านปัจจุบัน', 'current_password'],
              ['รหัสผ่านใหม่', 'new_password'],
              ['ยืนยันรหัสผ่านใหม่', 'confirm'],
            ].map(([label, field]) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
                <input
                  type="password" required
                  value={pwdForm[field]}
                  onChange={(e) => setPwdForm({ ...pwdForm, [field]: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
            <button type="submit" disabled={pwdLoading} style={{
              background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontWeight: 700, cursor: pwdLoading ? 'not-allowed' : 'pointer', opacity: pwdLoading ? 0.7 : 1,
            }}>บันทึก</button>
          </form>
        </div>
      </div>
    </div>
  )
}
