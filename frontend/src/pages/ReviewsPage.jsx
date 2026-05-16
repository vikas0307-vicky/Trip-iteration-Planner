// ReviewsPage.jsx - Feature 5: Hotel Reviews & Ratings
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function ReviewsPage() {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || '{}')

  const [hotels,   setHotels]   = useState([])
  const [reviews,  setReviews]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('hotelreviews') || '[]') } catch { return [] }
  })
  const [form, setForm] = useState({ hotelId:'', hotelName:'', rating:5, title:'', comment:'' })
  const [msg,  setMsg]  = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch(`${API}/hotels`).then(r => r.json()).then(d => setHotels(d.hotels || [])).catch(() => {})
  }, [])

  function saveReview(e) {
    e.preventDefault()
    if (!form.hotelId || !form.comment.trim() || !form.title.trim()) {
      setMsg('Please fill all fields')
      return
    }
    const newReview = {
      id:        Date.now(),
      ...form,
      userName:  user.name || 'Anonymous',
      date:      new Date().toLocaleDateString('en', { year:'numeric', month:'long', day:'numeric' }),
    }
    const updated = [newReview, ...reviews]
    setReviews(updated)
    localStorage.setItem('hotelreviews', JSON.stringify(updated))
    setForm({ hotelId:'', hotelName:'', rating:5, title:'', comment:'' })
    setMsg('✅ Review posted!')
    setTimeout(() => setMsg(''), 3000)
  }

  function deleteReview(id) {
    const updated = reviews.filter(r => r.id !== id)
    setReviews(updated)
    localStorage.setItem('hotelreviews', JSON.stringify(updated))
  }

  const filteredReviews = filter === 'All' ? reviews : reviews.filter(r => r.hotelName === filter)
  const hotelNames      = [...new Set(reviews.map(r => r.hotelName))]

  function StarRating({ value, onChange }) {
    return (
      <div style={{ display:'flex', gap:'6px' }}>
        {[1,2,3,4,5].map(star => (
          <span
            key={star}
            onClick={() => onChange && onChange(star)}
            style={{ fontSize:'28px', cursor: onChange ? 'pointer' : 'default', opacity: star <= value ? 1 : 0.25, transition:'opacity 0.15s' }}
          >⭐</span>
        ))}
      </div>
    )
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', marginBottom:'6px' }}>⭐ Hotel Reviews</h2>
        <p style={{ color:'#888', marginBottom:'24px', fontSize:'14px' }}>
          {reviews.length} review{reviews.length !== 1 ? 's' : ''} · Avg rating: {avgRating} ⭐
        </p>

        {/* Write a review */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 18px', fontSize:'17px' }}>✍️ Write a Review</h3>

          {msg && (
            <div style={{ background: msg.startsWith('✅') ? '#eafaf1' : '#ffeaea', border:`1px solid ${msg.startsWith('✅') ? '#a9dfbf' : '#f5c6c6'}`, color: msg.startsWith('✅') ? '#1e8449' : '#c0392b', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px', fontWeight:'600' }}>
              {msg}
            </div>
          )}

          <form onSubmit={saveReview}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={lbl}>Select Hotel *</label>
                <select style={inp} value={form.hotelId} onChange={e => {
                  const h = hotels.find(h => h._id === e.target.value)
                  setForm(p => ({ ...p, hotelId: e.target.value, hotelName: h?.name || '' }))
                }}>
                  <option value="">-- Choose a hotel --</option>
                  {hotels.map(h => <option key={h._id} value={h._id}>{h.name} — {h.location}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Your Rating *</label>
                <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={lbl}>Review Title *</label>
              <input style={inp} placeholder="e.g. Amazing experience, highly recommend!" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>

            <div style={{ marginBottom:'16px' }}>
              <label style={lbl}>Your Review *</label>
              <textarea style={{ ...inp, minHeight:'100px', resize:'vertical' }} placeholder="Tell others about your stay — food, service, rooms, location..." value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} />
            </div>

            <button type="submit" style={{ padding:'12px 28px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              📝 Post Review
            </button>
          </form>
        </div>

        {/* Filter by hotel */}
        {hotelNames.length > 0 && (
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
            {['All', ...hotelNames].map(name => (
              <button key={name} onClick={() => setFilter(name)} style={{
                padding:'6px 14px', borderRadius:'20px', border:'1.5px solid',
                borderColor: filter === name ? '#1e3a5f' : '#ddd',
                background:  filter === name ? '#1e3a5f' : '#fff',
                color:       filter === name ? '#fff' : '#555',
                cursor:'pointer', fontSize:'12px', fontWeight:'500', fontFamily:'Poppins,sans-serif',
              }}>{name === 'All' ? '🏨 All Hotels' : name}</button>
            ))}
          </div>
        )}

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'50px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:'50px', marginBottom:'12px' }}>⭐</div>
            <p style={{ color:'#888', fontSize:'15px' }}>No reviews yet. Be the first to write one!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {filteredReviews.map(r => (
              <div key={r.id} style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'10px' }}>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'16px', flexShrink:0 }}>
                      {r.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px' }}>{r.userName}</div>
                      <div style={{ fontSize:'12px', color:'#888' }}>{r.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'12px', color:'#2980b9', fontWeight:'600', marginBottom:'4px' }}>🏨 {r.hotelName}</div>
                    <div>{'⭐'.repeat(r.rating)}<span style={{ fontSize:'11px', color:'#888', marginLeft:'4px' }}>({r.rating}/5)</span></div>
                  </div>
                </div>

                <div style={{ marginTop:'14px' }}>
                  <div style={{ fontWeight:'700', fontSize:'15px', color:'#1e3a5f', marginBottom:'6px' }}>{r.title}</div>
                  <p style={{ color:'#555', fontSize:'14px', lineHeight:'1.7', margin:0 }}>{r.comment}</p>
                </div>

                {r.userName === user.name && (
                  <button onClick={() => deleteReview(r.id)} style={{ marginTop:'12px', padding:'5px 14px', background:'#ffeaea', color:'#e74c3c', border:'1px solid #f5c6c6', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' }
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }
