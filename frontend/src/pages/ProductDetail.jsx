import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { FiMinus, FiPlus } from 'react-icons/fi'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <><Navbar /><LoadingSpinner /></>
  if (!product) return <><Navbar /><div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>ไม่พบสินค้า</div></>

  const total = Number(product.price) * quantity

  const handleOrder = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setOrdering(true)
    setError('')
    try {
      await api.post('/orders', { product_id: product.id, quantity })
      await refreshUser()
      setShowModal(false)
      setSuccess('สั่งซื้อสำเร็จ!')
      setQuantity(1)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด'
      setError(msg.includes('balance') || msg.includes('ยอดเงิน') ? 'ยอดเงินไม่เพียงพอ' : msg)
    } finally {
      setOrdering(false)
    }
  }

  const qty = (delta) => setQuantity((q) => Math.min(product.stock, Math.max(1, q + delta)))

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 40, background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 380, flexShrink: 0, height: 360, background: '#f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>ไม่มีรูปภาพ</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {product.category_name && (
              <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 }}>
                {product.category_name}
              </span>
            )}
            <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>{product.name}</h1>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#dc2626', marginBottom: 12 }}>
              ฿{Number(product.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            {product.description && (
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>{product.description}</p>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: product.stock > 0 ? '#16a34a' : '#dc2626', marginBottom: 20 }}>
              {product.stock > 0 ? `มีสินค้า (คงเหลือ ${product.stock})` : 'หมดสต็อก'}
            </div>

            {product.stock > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>จำนวน:</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => qty(-1)} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer' }}><FiMinus size={14} /></button>
                    <span style={{ padding: '8px 16px', fontWeight: 700, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', minWidth: 48, textAlign: 'center' }}>{quantity}</span>
                    <button onClick={() => qty(1)} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer' }}><FiPlus size={14} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                  ยอดรวม: <strong style={{ color: '#dc2626', fontSize: 18 }}>฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                </div>
                <button
                  onClick={() => { setError(''); setShowModal(true) }}
                  style={{
                    background: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '13px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  }}
                >สั่งซื้อ</button>
              </>
            )}
            {success && <div style={{ marginTop: 14, color: '#16a34a', fontWeight: 600 }}>{success}</div>}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="ยืนยันการสั่งซื้อ" onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{product.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>จำนวน: <strong>{quantity}</strong></div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>ราคาต่อหน่วย: <strong>฿{Number(product.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 8 }}>
              ยอดรวม: ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleOrder} disabled={ordering}
              style={{
                flex: 1, background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px', fontWeight: 700, cursor: ordering ? 'not-allowed' : 'pointer',
                opacity: ordering ? 0.7 : 1,
              }}
            >{ordering ? 'กำลังสั่งซื้อ...' : 'ยืนยัน'}</button>
            <button onClick={() => setShowModal(false)} style={{
              flex: 1, background: 'none', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '11px', cursor: 'pointer', color: '#374151',
            }}>ยกเลิก</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
