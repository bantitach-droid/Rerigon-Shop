import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingBag } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 14,
}

export default function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f3f4f6', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 36,
        width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <FiShoppingBag size={40} color="#dc2626" />
          <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 8 }}>Rerigon Shop</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>สมัครสมาชิก</h1>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            ['ชื่อผู้ใช้', 'username', 'text', 'กรอกชื่อผู้ใช้'],
            ['อีเมล', 'email', 'email', 'กรอกอีเมล'],
            ['รหัสผ่าน', 'password', 'password', 'กรอกรหัสผ่าน'],
            ['ยืนยันรหัสผ่าน', 'confirmPassword', 'password', 'กรอกรหัสผ่านอีกครั้ง'],
          ].map(([label, field, type, placeholder]) => (
            <div key={field}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>{label}</label>
              <input
                type={type} placeholder={placeholder} required
                style={inputStyle}
                value={form[field]} onChange={update(field)}
              />
            </div>
          ))}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 8, padding: '12px', fontSize: 15,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >{loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          มีบัญชีแล้ว?{' '}
          <Link to="/login" style={{ color: '#dc2626', fontWeight: 600 }}>เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  )
}
