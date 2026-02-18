import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const hasImage = !!product.image_url
  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ width: '100%', height: 200, background: '#f3f4f6', overflow: 'hidden' }}>
        {hasImage ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
            ไม่มีรูปภาพ
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {product.category_name && (
          <span style={{
            display: 'inline-block', background: '#dc2626', color: '#fff',
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'flex-start',
          }}>{product.category_name}</span>
        )}
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
          ฿{Number(product.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 12, color: product.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
          {product.stock > 0 ? `มีสินค้า (${product.stock})` : 'หมดสต็อก'}
        </div>
        <Link
          to={`/products/${product.id}`}
          style={{
            marginTop: 'auto', display: 'block', textAlign: 'center',
            background: '#dc2626', color: '#fff', borderRadius: 8,
            padding: '9px', fontWeight: 600, fontSize: 13,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
        >ดูสินค้า</Link>
      </div>
    </div>
  )
}
