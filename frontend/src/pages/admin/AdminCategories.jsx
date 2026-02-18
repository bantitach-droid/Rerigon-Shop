import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import api from '../../api/axios'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'

const empty = { name: '', description: '' }
const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 12 }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/categories').then((res) => {
      const d = res.data
      setCategories(Array.isArray(d) ? d : (d?.data || []))
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openAdd = () => { setForm(empty); setError(''); setModal('add') }
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '' }); setError(''); setModal(c.id) }

  const save = async () => {
    setError(''); setSaving(true)
    try {
      if (modal === 'add') await api.post('/categories', form)
      else await api.put(`/categories/${modal}`, form)
      setModal(null); fetch()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด')
    } finally { setSaving(false) }
  }

  const doDelete = async () => {
    try { await api.delete(`/categories/${deleteId}`); setDeleteId(null); fetch() } catch {}
  }

  const thS = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>จัดการหมวดหมู่</h1>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={16} /> เพิ่มหมวดหมู่
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thS}>#</th><th style={thS}>ชื่อ</th><th style={thS}>คำอธิบาย</th>
                <th style={thS}>จำนวนสินค้า</th><th style={thS}>Actions</th>
              </tr></thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>{i + 1}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ ...tdS, color: '#6b7280' }}>{c.description || '-'}</td>
                    <td style={tdS}>{c.product_count ?? 0}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(c)} style={{ background: '#f0fdf4', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#16a34a' }}><FiEdit2 size={14} /></button>
                        <button onClick={() => setDeleteId(c.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#dc2626' }}><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal && (
        <Modal title={modal === 'add' ? 'เพิ่มหมวดหมู่' : 'แก้ไขหมวดหมู่'} onClose={() => setModal(null)}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>ชื่อหมวดหมู่</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>คำอธิบาย</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            <button onClick={() => setModal(null)} style={{ flex: 1, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteId(null)}>
          <p style={{ marginBottom: 16, fontSize: 14 }}>คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={doDelete} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>ลบ</button>
            <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
