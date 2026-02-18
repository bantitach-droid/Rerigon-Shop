import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import api from '../../api/axios'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'

const empty = { title: '', content: '', is_active: true }
const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 12 }

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/announcements').then((res) => {
      const d = res.data
      setAnnouncements(Array.isArray(d) ? d : (d?.data || []))
    }).catch(() => setAnnouncements([])).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openAdd = () => { setForm(empty); setError(''); setModal('add') }
  const openEdit = (a) => { setForm({ title: a.title, content: a.content, is_active: a.is_active }); setError(''); setModal(a.id) }

  const save = async () => {
    setError(''); setSaving(true)
    try {
      if (modal === 'add') await api.post('/announcements', form)
      else await api.put(`/announcements/${modal}`, form)
      setModal(null); fetch()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'เกิดข้อผิดพลาด')
    } finally { setSaving(false) }
  }

  const toggle = async (a) => {
    try { await api.put(`/announcements/${a.id}`, { ...a, is_active: !a.is_active }); fetch() } catch {}
  }

  const doDelete = async () => {
    try { await api.delete(`/announcements/${deleteId}`); setDeleteId(null); fetch() } catch {}
  }

  const thS = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>จัดการประกาศ</h1>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={16} /> เพิ่มประกาศ
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? <LoadingSpinner /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thS}>หัวข้อ</th><th style={thS}>เนื้อหา</th>
                <th style={thS}>สถานะ</th><th style={thS}>Actions</th>
              </tr></thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdS, fontWeight: 600, maxWidth: 200 }}>{a.title}</td>
                    <td style={{ ...tdS, color: '#6b7280', maxWidth: 300 }}>
                      {a.content?.length > 80 ? a.content.slice(0, 80) + '...' : a.content}
                    </td>
                    <td style={tdS}>
                      <span style={{
                        background: a.is_active ? '#f0fdf4' : '#f9fafb',
                        color: a.is_active ? '#16a34a' : '#6b7280',
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      }}>{a.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => toggle(a)} style={{
                          background: a.is_active ? '#fef2f2' : '#f0fdf4',
                          color: a.is_active ? '#dc2626' : '#16a34a',
                          border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        }}>{a.is_active ? 'ปิด' : 'เปิด'}</button>
                        <button onClick={() => openEdit(a)} style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#2563eb' }}><FiEdit2 size={13} /></button>
                        <button onClick={() => setDeleteId(a.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#dc2626' }}><FiTrash2 size={13} /></button>
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
        <Modal title={modal === 'add' ? 'เพิ่มประกาศ' : 'แก้ไขประกาศ'} onClose={() => setModal(null)}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>หัวข้อ</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>เนื้อหา</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>เปิดใช้งาน</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            <button onClick={() => setModal(null)} style={{ flex: 1, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteId(null)}>
          <p style={{ marginBottom: 16, fontSize: 14 }}>คุณต้องการลบประกาศนี้ใช่หรือไม่?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={doDelete} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>ลบ</button>
            <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
