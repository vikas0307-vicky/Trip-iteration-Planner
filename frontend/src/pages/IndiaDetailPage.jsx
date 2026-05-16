import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'
const CAT_ICONS = { Beach:'🏖️', Mountain:'🏔️', Heritage:'🏰', Wildlife:'🐯', Adventure:'🧗', Pilgrimage:'⛩️', Nature:'🌿', City:'🌆' }
const SEA_COLORS = { Summer:'#e67e22', Winter:'#2980b9', Monsoon:'#27ae60', 'All Year':'#8e44ad' }

export default function IndiaDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [dest,   setDest]   = useState(null)
  const [hotels, setHotels] = useState([])
  const [placesToVisit, setPlacesToVisit] = useState([])

  useEffect(() => {
    fetch(`${API}/india-destinations/${id}`)
      .then(r=>r.json())
      .then(d=>{ setDest(d.destination); setHotels(d.hotels||[]); setPlacesToVisit(d.placesToVisit||[]) })
      .catch(()=>{})
  }, [id])

  if (!dest) return (
    <div style={{ fontFamily:'Poppins,sans-serif', minHeight:'100vh', background:'#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign:'center', padding:'80px', color:'#888' }}>⏳ Loading destination...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <button onClick={() => navigate('/india')} style={{ background:'none', border:'none', color:'#2980b9', fontSize:'14px', cursor:'pointer', marginBottom:'16px', fontFamily:'Poppins,sans-serif', fontWeight:'600' }}>← Back to India Destinations</button>

        {/* Hero card */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2980b9)', borderRadius:'18px', padding:'32px', color:'#fff', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20px', right:'-20px', fontSize:'120px', opacity:.1 }}>{CAT_ICONS[dest.category]}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <div style={{ fontSize:'14px', opacity:.8, marginBottom:'4px' }}>📍 {dest.state}, India</div>
              <h1 style={{ fontSize:'32px', fontWeight:'700', margin:'0 0 8px' }}>{dest.name}</h1>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
                {dest.bestSeason?.map(s => (
                  <span key={s} style={{ background:SEA_COLORS[s]||'#888', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'12px' }}>{s}</span>
                ))}
                <span style={{ background:'rgba(255,255,255,0.2)', fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'12px' }}>{dest.category}</span>
              </div>
              <p style={{ fontSize:'15px', opacity:.9, lineHeight:'1.7', maxWidth:'520px', margin:0 }}>{dest.description}</p>
            </div>
            <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:'20px 28px' }}>
              <div style={{ fontSize:'42px', marginBottom:'4px' }}>{CAT_ICONS[dest.category]}</div>
              <div style={{ fontSize:'28px', fontWeight:'700' }}>⭐ {dest.rating}</div>
              <div style={{ fontSize:'12px', opacity:.8 }}>Rating</div>
              <div style={{ marginTop:'12px', fontSize:'18px', fontWeight:'700' }}>₹{dest.avgBudgetPerDay?.toLocaleString()}</div>
              <div style={{ fontSize:'11px', opacity:.8 }}>per day avg</div>
            </div>
          </div>
        </div>

        {placesToVisit.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', flexWrap:'wrap', marginBottom:'14px' }}>
              <div>
                <h3 style={{ color:'#1e3a5f', margin:'0 0 4px', fontSize:'18px' }}>Places to Visit in {dest.name}</h3>
                <p style={{ color:'#888', margin:0, fontSize:'13px' }}>{placesToVisit.length} places with available hotel options</p>
              </div>
              <button onClick={() => navigate(`/hotels?search=${encodeURIComponent(dest.name)}`)} style={{ padding:'8px 14px', background:'#f8fafc', color:'#1e3a5f', border:'1px solid #d8e2ec', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                All {dest.name} Hotels
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
              {placesToVisit.map(place => (
                <div key={place.name} style={{ background:'#f8fafc', border:'1px solid #e5edf5', borderRadius:'12px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontWeight:'800', color:'#1e3a5f', fontSize:'15px' }}>{place.name}</div>
                      <div style={{ color:'#64748b', fontSize:'12px', marginTop:'2px' }}>{place.area} - {place.type}</div>
                    </div>
                    <span style={{ background:'#fff3cd', color:'#9a6a00', borderRadius:'10px', padding:'3px 8px', fontSize:'10px', fontWeight:'800', whiteSpace:'nowrap' }}>{place.bestTime}</span>
                  </div>
                  <p style={{ color:'#555', fontSize:'12px', lineHeight:'1.6', margin:'0 0 10px' }}>{place.description}</p>
                  {place.hotels?.length > 0 && (
                    <div>
                      <div style={{ color:'#1e3a5f', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                        Hotels Available Near This Place ({place.hotels.length})
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {place.hotels.map(h => (
                          <div key={`${place.name}-${h._id}`} style={{ background:'#fff', border:'1px solid #e8eef5', borderRadius:'9px', padding:'9px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' }}>
                            <div style={{ minWidth:0, flex:1 }}>
                              <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</div>
                              <div style={{ color:'#888', fontSize:'11px', marginTop:'2px' }}>Rs {h.price?.toLocaleString()}/night - {h.rating} rating</div>
                              <div style={{ color:'#64748b', fontSize:'10px', marginTop:'3px', lineHeight:'1.4' }}>{h.nearbyNote}</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                              <button onClick={() => navigate(`/hotels/${h._id}`)} style={{ padding:'5px 8px', background:'#fff', color:'#1e3a5f', border:'1px solid #1e3a5f', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                View
                              </button>
                              <button onClick={() => navigate(`/hotels/${h._id}#booking`)} style={{ padding:'5px 8px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!place.hotels || place.hotels.length === 0) && (
                    <div style={{ background:'#fff', border:'1px solid #e8eef5', borderRadius:'9px', padding:'10px', color:'#64748b', fontSize:'12px', lineHeight:'1.5' }}>
                      No hotel is linked to this exact place yet.
                      <button onClick={() => navigate(`/hotels?search=${encodeURIComponent(dest.name)}`)} style={{ marginTop:'8px', display:'block', padding:'7px 10px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        See {dest.name} Hotels
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top attractions */}
        {dest.topAttractions?.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>🎯 Top Attractions</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px' }}>
              {dest.topAttractions.map((a,i) => (
                <div key={i} style={{ background:'#f0f4f8', borderRadius:'10px', padding:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ color:'#f39c12', fontSize:'18px' }}>★</span>
                  <span style={{ fontSize:'13px', fontWeight:'500', color:'#333' }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel info */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>ℹ️ Travel Information</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
            {[
              { icon:'📅', label:'Best Season', value:dest.bestSeason?.join(', ') },
              { icon:'🏷️', label:'Category',    value:dest.category },
              { icon:'💰', label:'Avg Budget',  value:`₹${dest.avgBudgetPerDay?.toLocaleString()}/day` },
              { icon:'⭐', label:'Rating',      value:`${dest.rating}/5.0` },
              { icon:'📍', label:'State',       value:dest.state },
              { icon:'🗺️', label:'Coordinates', value:`${dest.lat?.toFixed(2)}°N, ${dest.lng?.toFixed(2)}°E` },
            ].map(r => (
              <div key={r.label} style={{ background:'#f8fafc', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontSize:'20px', marginBottom:'4px' }}>{r.icon}</div>
                <div style={{ fontSize:'11px', color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>{r.label}</div>
                <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels nearby */}
        {hotels.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>🏨 Hotels in {dest.name}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {hotels.map(h => (
                <div key={h._id} onClick={() => navigate(`/hotels/${h._id}`)}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px', border:'1.5px solid #eee', borderRadius:'12px', cursor:'pointer', gap:'12px', flexWrap:'wrap', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.background='#f0f4f8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#eee'; e.currentTarget.style.background='#fff' }}>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <div style={{ fontSize:'28px' }}>🏨</div>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{h.name}</div>
                      <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>📍 {h.location}</div>
                      <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                        {h.amenities?.slice(0,3).map(a => <span key={a} style={{ background:'#ebf5fb', color:'#2980b9', fontSize:'10px', padding:'2px 7px', borderRadius:'6px' }}>{a}</span>)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:'700', fontSize:'18px', color:'#1e3a5f' }}>₹{h.price?.toLocaleString()}<span style={{ fontSize:'11px', color:'#888', fontWeight:'400' }}>/night</span></div>
                    <div style={{ fontSize:'11px', color:'#f39c12', marginTop:'2px' }}>⭐ {h.rating} · {h.category}</div>
                    <button onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}#booking`) }} style={{ marginTop:'8px', padding:'6px 14px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Book Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'12px', marginTop:'20px', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/chatbot')} style={{ padding:'12px 24px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            🤖 Ask Travel Assistant
          </button>
          <button onClick={() => navigate('/hotels')} style={{ padding:'12px 24px', background:'#fff', color:'#1e3a5f', border:'2px solid #1e3a5f', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            🏨 Browse All Hotels
          </button>
        </div>
      </div>
    </div>
  )
}
