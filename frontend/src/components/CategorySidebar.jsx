export default function CategorySidebar({ categories, selectedCategory, onSelect }) {
  const itemStyle = (active) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
    background: active ? '#dc2626' : 'transparent',
    color: active ? '#fff' : '#374151', fontSize: 14, transition: 'background 0.15s',
  })

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
        หมวดหมู่
      </h3>
      <div
        style={itemStyle(!selectedCategory)}
        onClick={() => onSelect(null)}
        onMouseEnter={(e) => { if (selectedCategory) e.currentTarget.style.background = '#f3f4f6' }}
        onMouseLeave={(e) => { if (selectedCategory) e.currentTarget.style.background = 'transparent' }}
      >
        <span>ทั้งหมด</span>
      </div>
      {categories.map((cat) => {
        const active = selectedCategory === cat.id
        return (
          <div
            key={cat.id}
            style={itemStyle(active)}
            onClick={() => onSelect(cat.id)}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <span>{cat.name}</span>
            <span style={{
              fontSize: 11, background: active ? 'rgba(255,255,255,0.3)' : '#f3f4f6',
              color: active ? '#fff' : '#6b7280', borderRadius: 10, padding: '1px 7px',
            }}>{cat.product_count ?? 0}</span>
          </div>
        )
      })}
    </div>
  )
}
