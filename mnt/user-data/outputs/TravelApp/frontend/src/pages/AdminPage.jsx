import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function AdminPage() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const headers  = { 'Content-Type':'application/json', authorization:token }

  const [tab,      setTab]      = useState('dashboard')
  const [stats,    setStats]    = useState({})
  const [users,    setUsers]    = useState([])
  const [hotels,   setHotels]   = useState([])
  const [bookings, setBookings] = useState([])
  const [trips,    setTrips]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState({ show:false, text:'', ok:true })
  const [hForm,    setHForm]    = useState({ name:'', location:'', city:'', state:'', description:'', price:'', category:'Standard', amenities:'WiFi, Pool', rooms:'50', rating:'4.0', season:'All Year' })

  useEffect(() => {
    if (user.role !== 'admin') { navigate('/'); return }
    loadAll()
  }, [])

  function showToast(text, ok=true) {
    setToast({ show:true, text, ok })
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3000)
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [s,u,b,h,t] = await Promise.all([
        fetch(`${API}/admin/stats`,    { headers }).then(r=>r.json()),
        fetch(`${API}/admin/users`,    { headers }).then(r=>r.json()),
        fetch(`${API}/admin/bookings`, { headers }).then(r=>r.json()),
        fetch(`${API}/hotels`,         {}).then(r=>r.json()),
        fetch(`${API}/admin/trips`,    { headers }).then(r=>r.json()),
      ])
      setStats(s||{})
      setUsers(u.users||[])
      setBookings(b.bookings||[])
      setHotels(h.hotels||[])
      setTrips(t.trips||[])
    } catch { showToast('Failed to load data','error') }
    finally { setLoading(false) }
  }

  async function addHotel(e) {
    e.preventDefault()
    try {
      const res  = await fetch(`${API}/hotels`, { method:'POST', headers, body:JSON.stringify({ ...hForm, price:Number(hForm.price), rooms:Number(hForm.rooms), rating:Number(hForm.rating), amenities:hForm.amenities.split(',').map(a=>a.trim()), season:hForm.season.split(',').map(s=>s.trim()) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showToast('✅ Hotel added successfully!')
      setHForm({ name:'', location:'', city:'', state:'', description:'', price:'', category:'Standard', amenities:'WiFi, Pool', rooms:'50', rating:'4.0', season:'All Year' })
      loadAll()
    } catch (err) { showToast('❌ ' + err.message, false) }
  }

  async function deleteHotel(id) {
    if (!window.confirm('Delete this hotel?')) return
    await fetch(`${API}/hotels/${id}`, { method:'DELETE', headers })
    showToast('Hotel deleted')
    setHotels(p=>p.filter(h=>h._id!==id))
  }

  async function changeRole(id, role) {
    await fetch(`${API}/admin/users/${id}/role`, { method:'PUT', headers, body:JSON.stringify({ role }) })
    setUsers(p=>p.map(u=>u._id===id ? { ...u, role } : u))
    showToast(`Role changed to ${role}`)
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user?')) return
    await fetch(`${API}/admin/users/${id}`, { method:'DELETE', headers })
    setUsers(p=>p.filter(u=>u._id!==id))
    showToast('User deleted')
  }

  const TABS = [
    { id:'dashboard', label:'📊 Dashboard' },
    { id:'hotels',    label:'🏨 Hotels'    },
    { id:'users',     label:'👥 Users'     },
    { id:'bookings',  label:'📅 Bookings'  },
    { id:'trips',     label:'🧳 Trips'     },
  ]

  if (loading) return (
    <div style={{ fontFamily:'Poppins,sans-serif', minHeight:'100vh', background:'#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign:'center', padding:'80px', color:'#888', fontSize:'16px' }}>⏳ Loading admin panel...</div>
    </div>
  )

  return (
    <div style={{ fontFamily:'Poppins,sans-serif', minHeight:'100vh', background:'#f0f4f8' }}>
      <Navbar />

      {toast.show && (
        <div style={{ position:'fixed', top:'70px', right:'20px', zIndex:9999, padding:'12px 20px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', background:toast.ok?'#eafaf1':'#ffeaea', color:toast.ok?'#1e8449':'#c0392b', border:`1px solid ${toast.ok?'#a9dfbf':'#f5c6c6'}` }}>
          {toast.text}
        </div>
      )}

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', margin:'0 0 4px' }}>⚙️ Admin Panel</h2>
            <p style={{ color:'#888', fontSize:'13px', margin:0 }}>Logged in as: <strong>{user.name}</strong> · <span style={{ color:'#e67e22', fontWeight:'600' }}>Admin</span></p>
          </div>
          <button onClick={loadAll} style={{ padding:'10px 18px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>🔄 Refresh</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'24px', background:'#fff', padding:'8px', borderRadius:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'10px 18px', border:'none', borderRadius:'10px', cursor:'pointer', background:tab===t.id?'#1e3a5f':'transparent', color:tab===t.id?'#fff':'#555', fontWeight:tab===t.id?'700':'400', fontSize:'14px', fontFamily:'Poppins,sans-serif', transition:'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'14px', marginBottom:'24px' }}>
              {[
                { l:'👥 Users',       v:stats.totalUsers    ||0, c:'#3498db' },
                { l:'🏨 Hotels',      v:stats.totalHotels   ||0, c:'#9b59b6' },
                { l:'📅 Bookings',    v:stats.totalBookings ||0, c:'#e67e22' },
                { l:'❌ Cancelled',   v:stats.cancelledCount||0, c:'#e74c3c' },
                { l:'🧳 Trips',       v:stats.totalTrips    ||0, c:'#27ae60' },
                { l:'🌍 Destinations',v:stats.totalDests    ||0, c:'#16a085' },
                { l:'💰 Revenue',     v:'₹'+(stats.totalRevenue||0).toLocaleString(), c:'#f39c12' },
              ].map(s => (
                <div key={s.l} style={{ background:'#fff', borderRadius:'14px', padding:'20px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', borderTop:`4px solid ${s.c}` }}>
                  <div style={{ fontSize:'26px', fontWeight:'700', color:s.c }}>{s.v}</div>
                  <div style={{ color:'#888', fontSize:'12px', marginTop:'4px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOTELS */}
        {tab === 'hotels' && (
          <div>
            <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
              <h3 style={{ color:'#1e3a5f', margin:'0 0 18px' }}>➕ Add New Hotel</h3>
              <form onSubmit={addHotel}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  {[['name','Hotel Name','The Grand Resort',true],['location','Full Location (City, State)','Jaipur, Rajasthan',true],['city','City','Jaipur',true],['state','State','Rajasthan',true],['price','Price/Night (₹)','5000',true],['rooms','Rooms','50',false],['rating','Rating (1–5)','4.5',false]].map(([k,label,ph,req]) => (
                    <div key={k}>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase' }}>{label}</label>
                      <input type={['price','rooms','rating'].includes(k)?'number':'text'} placeholder={ph} value={hForm[k]} onChange={e=>setHForm(p=>({...p,[k]:e.target.value}))} required={req}
                        style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }} />
                    </div>
                  ))}
                  <div style={{ gridColumn:'span 2' }}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase' }}>Description</label>
                    <textarea placeholder="Describe the hotel..." value={hForm.description} onChange={e=>setHForm(p=>({...p,description:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box', minHeight:'60px', resize:'vertical' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase' }}>Category</label>
                    <select value={hForm.category} onChange={e=>setHForm(p=>({...p,category:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }}>
                      {['Budget','Standard','Luxury'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase' }}>Amenities (comma separated)</label>
                    <input placeholder="WiFi, Pool, Spa" value={hForm.amenities} onChange={e=>setHForm(p=>({...p,amenities:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }} />
                  </div>
                  <div style={{ gridColumn:'span 2' }}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase' }}>Best Season (comma separated: Summer, Winter, Monsoon, All Year)</label>
                    <input placeholder="Winter, Summer" value={hForm.season} onChange={e=>setHForm(p=>({...p,season:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }} />
                  </div>
                </div>
                <button type="submit" style={{ marginTop:'16px', width:'100%', padding:'13px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  ➕ Add Hotel
                </button>
              </form>
            </div>

            <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
              <h3 style={{ color:'#1e3a5f', margin:'0 0 14px' }}>🏨 All Hotels ({hotels.length})</h3>
              {hotels.map(h => (
                <div key={h._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap', gap:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'26px' }}>🏨</span>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{h.name}</div>
                      <div style={{ color:'#888', fontSize:'12px' }}>📍 {h.location} · {h.category} · ₹{h.price?.toLocaleString()}/night · ⭐{h.rating}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteHotel(h._id)} style={{ padding:'6px 14px', background:'#ffeaea', color:'#e74c3c', border:'1px solid #f5c6c6', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px' }}>👥 All Users ({users.length})</h3>
            {users.map(u => (
              <div key={u._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap', gap:'8px' }}>
                <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'16px', flexShrink:0 }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:'600', fontSize:'14px' }}>{u.name}</div>
                    <div style={{ color:'#888', fontSize:'12px' }}>{u.email}</div>
                    <span style={{ display:'inline-block', marginTop:'3px', padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:u.role==='admin'?'#fff3cd':'#ebf5fb', color:u.role==='admin'?'#856404':'#2980b9' }}>{u.role==='admin'?'⚙️ Admin':'👤 User'}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {u.role !== 'admin'
                    ? <button onClick={() => changeRole(u._id,'admin')} style={{ padding:'6px 12px', background:'#fff3cd', color:'#856404', border:'1px solid #f9ca24', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>⚙️ Make Admin</button>
                    : <button onClick={() => changeRole(u._id,'user')}  style={{ padding:'6px 12px', background:'#ebf5fb', color:'#2980b9', border:'1px solid #aed6f1', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>👤 Make User</button>
                  }
                  <button onClick={() => deleteUser(u._id)} style={{ padding:'6px 12px', background:'#ffeaea', color:'#e74c3c', border:'1px solid #f5c6c6', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px' }}>📅 All Bookings ({bookings.length})</h3>
            {bookings.map(b => (
              <div key={b._id} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap', gap:'8px' }}>
                <div>
                  <div style={{ fontWeight:'600', fontSize:'14px' }}>🏨 {b.hotelName}</div>
                  <div style={{ color:'#888', fontSize:'12px', marginTop:'2px' }}>📅 {b.checkIn} → {b.checkOut} · 👥 {b.guests} guests · 🌙 {b.nights} nights</div>
                  {b.status === 'cancelled' && <div style={{ color:'#e74c3c', fontSize:'12px', marginTop:'2px' }}>❌ Cancelled: {b.cancelReason}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:'700', color:'#1e3a5f', fontSize:'15px' }}>₹{b.totalPrice?.toLocaleString()}</div>
                  <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background:b.paymentStatus==='paid'?'#eafaf1':'#fff8e1', color:b.paymentStatus==='paid'?'#27ae60':'#e67e22' }}>{b.paymentStatus}</span>
                  {b.status === 'cancelled' && <div style={{ marginTop:'2px' }}><span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background:'#ffeaea', color:'#e74c3c' }}>cancelled</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRIPS */}
        {tab === 'trips' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px' }}>🧳 All Trips ({trips.length})</h3>
            {trips.map(t => (
              <div key={t._id} style={{ padding:'12px 0', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ fontWeight:'600', fontSize:'14px' }}>🌍 {t.tripName}</div>
                <div style={{ color:'#888', fontSize:'12px', marginTop:'2px' }}>📍 {t.destination} · 👥 {t.travelers} travelers {t.budget ? `· 💰 ₹${t.budget?.toLocaleString()}` : ''}</div>
                {t.startDate && <div style={{ color:'#aaa', fontSize:'12px', marginTop:'2px' }}>📅 {t.startDate} → {t.endDate}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}