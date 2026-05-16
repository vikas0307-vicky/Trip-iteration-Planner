import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

const TYPE_CONFIG = {
  booking_confirmed: { icon:'🏨', color:'#27ae60', bg:'#eafaf1', border:'#a9dfbf' },
  booking_cancelled: { icon:'❌', color:'#e74c3c', bg:'#ffeaea', border:'#f5c6c6' },
  payment_success:   { icon:'💳', color:'#2980b9', bg:'#ebf5fb', border:'#aed6f1' },
  trip_created:      { icon:'🌍', color:'#9b59b6', bg:'#f5eef8', border:'#d7bde2' },
  reminder:          { icon:'⏰', color:'#e67e22', bg:'#fef9e7', border:'#f9e79f' },
  default:           { icon:'🔔', color:'#555',    bg:'#f8f9fa', border:'#ddd'    },
}

export default function NotificationsPage() {
  const token = localStorage.getItem('token')
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(true)

  function load() {
    fetch(`${API}/notifications`, { headers:{ authorization:token }})
      .then(r=>r.json())
      .then(d=>{ setNotifications(d.notifications||[]); setUnread(d.unreadCount||0) })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    await fetch(`${API}/notifications/mark-read`, { method:'PUT', headers:{ authorization:token }})
    setNotifications(prev => prev.map(n => ({ ...n, read:true })))
    setUnread(0)
  }

  async function deleteOne(id) {
    await fetch(`${API}/notifications/${id}`, { method:'DELETE', headers:{ authorization:token }})
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  async function markOneRead(id) {
    await fetch(`${API}/notifications/${id}/read`, { method:'PUT', headers:{ authorization:token }})
    setNotifications(prev => prev.map(n => n._id===id ? { ...n, read:true } : n))
    setUnread(u => Math.max(0, u-1))
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff/60000)
    if (m < 1)  return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m/60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h/24)}d ago`
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1e3a5f', margin:'0 0 4px' }}>
              🔔 Notifications {unread > 0 && <span style={{ background:'#e74c3c', color:'#fff', borderRadius:'20px', padding:'2px 10px', fontSize:'13px', marginLeft:'8px' }}>{unread}</span>}
            </h2>
            <p style={{ color:'#888', fontSize:'13px', margin:0 }}>{notifications.length} total · {unread} unread</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ padding:'9px 18px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              ✓ Mark all read
            </button>
          )}
        </div>

        {loading && <div style={{ textAlign:'center', padding:'50px', color:'#888' }}>⏳ Loading...</div>}

        {!loading && notifications.length === 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:'50px', marginBottom:'12px' }}>🔔</div>
            <p style={{ fontWeight:'600', color:'#444', margin:'0 0 8px' }}>No notifications yet</p>
            <p style={{ color:'#888', fontSize:'13px' }}>Book a hotel or plan a trip to get started!</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default
            return (
              <div key={n._id} onClick={() => !n.read && markOneRead(n._id)}
                style={{ background:n.read ? '#fff' : cfg.bg, border:`1.5px solid ${n.read ? '#eee' : cfg.border}`, borderRadius:'14px', padding:'16px 18px', cursor: n.read ? 'default' : 'pointer', transition:'all 0.2s', position:'relative' }}>
                <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                  <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:cfg.bg, border:`2px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', flexWrap:'wrap' }}>
                      <div style={{ fontWeight:'700', fontSize:'14px', color:cfg.color }}>{n.title}</div>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'11px', color:'#aaa' }}>{timeAgo(n.createdAt)}</span>
                        {!n.read && <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:cfg.color, display:'inline-block' }} />}
                      </div>
                    </div>
                    <p style={{ color:'#555', fontSize:'13px', lineHeight:'1.6', margin:'4px 0 0', whiteSpace:'pre-wrap' }}>{n.message}</p>
                    {n.data?.refundAmount && (
                      <div style={{ marginTop:'8px', background:'#fff', border:'1px solid #f5c6c6', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', color:'#e74c3c', fontWeight:'600' }}>
                        💰 Refund Amount: ₹{n.data.refundAmount?.toLocaleString()} (5–7 business days)
                      </div>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteOne(n._id) }} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:'18px', padding:0, flexShrink:0 }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}