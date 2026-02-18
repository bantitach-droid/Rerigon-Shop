import { useState } from 'react'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { FiSmartphone, FiCreditCard, FiDollarSign, FiMessageCircle } from 'react-icons/fi'

const methods = [
  { id: 'promptpay', label: 'PromptPay', icon: FiSmartphone, fee: '0%', color: '#6d28d9' },
  { id: 'bank_transfer', label: 'โอนธนาคาร', icon: FiCreditCard, fee: '0%', color: '#1d4ed8' },
  { id: 'truemoney', label: 'TrueMoney', icon: FiDollarSign, fee: '2%', color: '#dc2626' },
  { id: 'linepay', label: 'Line Pay', icon: FiMessageCircle, fee: '1%', color: '#16a34a' },
]

export default function Topup() {
  const { balance, refreshUser } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleTopup = async () => {
    setError('')
    const num = Number(amount)
    if (!num || num <= 0) { setError('กรุณากรอกจำนวนเงินที่ถูกต้อง'); return }
    setLoading(true)
    try {
      await api.post('/topup', { amount: num, payment_method: selectedMethod.id })
      await refreshUser()
      setSuccess(`ส่งคำขอเติมเงิน ฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2 })} สำเร็จ กำลังรอการอนุมัติ`)
      setSelectedMethod(null)
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>เติมเงิน</h1>

        <div style={{
          background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>ยอดเงินปัจจุบัน</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>
              ฿{Number(balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontWeight: 600 }}>
            ✓ {success}
          </div>
        )}

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>เลือกช่องทางการชำระเงิน</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelectedMethod(m); setError(''); setAmount('') }}
              style={{
                background: '#fff', border: '2px solid #e5e7eb', borderRadius: 12,
                padding: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <m.icon size={28} color={m.color} />
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>ค่าธรรมเนียม {m.fee}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedMethod && (
        <Modal title={`เติมเงินผ่าน ${selectedMethod.label}`} onClose={() => setSelectedMethod(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>จำนวนเงิน (บาท)</label>
            <input
              type="number" min="1" placeholder="กรอกจำนวนเงิน"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
            {amount && Number(amount) > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                ค่าธรรมเนียม: {selectedMethod.fee} → ยอดสุทธิ: <strong style={{ color: '#dc2626' }}>
                  ฿{Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}
          </div>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleTopup} disabled={loading}
              style={{
                flex: 1, background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >{loading ? 'กำลังดำเนินการ...' : 'ยืนยันการเติมเงิน'}</button>
            <button onClick={() => setSelectedMethod(null)} style={{
              flex: 1, background: 'none', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '11px', cursor: 'pointer',
            }}>ยกเลิก</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
