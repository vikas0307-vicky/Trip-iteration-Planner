// ItineraryPage.jsx - Feature 4: Day-by-day Trip Itinerary Builder
import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const TIME_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
const ACTIVITY_TYPES = ['🍳 Breakfast','🏛️ Sightseeing','🍜 Lunch','🚶 Walking tour','🏊 Activity','🛍️ Shopping','🍽️ Dinner','🎭 Entertainment','🚗 Transfer','😴 Rest','💆 Spa','🌅 Sunrise/Sunset']
const TYPE_COLORS = { '🍳 Breakfast':'#e67e22','🏛️ Sightseeing':'#2980b9','🍜 Lunch':'#e67e22','🚶 Walking tour':'#27ae60','🏊 Activity':'#9b59b6','🛍️ Shopping':'#e91e8c','🍽️ Dinner':'#c0392b','🎭 Entertainment':'#8e44ad','🚗 Transfer':'#7f8c8d','😴 Rest':'#95a5a6','💆 Spa':'#16a085','🌅 Sunrise/Sunset':'#f39c12' }

export default function ItineraryPage() {
  const [tripName,  setTripName]  = useState('')
  const [startDate, setStartDate] = useState('')
  const [numDays,   setNumDays]   = useState(3)
  const [days,      setDays]      = useState([{ activities:[] }])
  const [activeDay, setActiveDay] = useState(0)
  const [form,      setForm]      = useState({ time:'09:00', type:'🏛️ Sightseeing', title:'', note:'', duration:'60' })
  const [saved,     setSaved]     = useState(false)

  function buildDays(n) {
    setNumDays(n)
    setDays(Array.from({ length: n }, (_, i) => days[i] || { activities:[] }))
    setActiveDay(Math.min(activeDay, n-1))
  }

  function addActivity(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const newAct = { ...form, id: Date.now() }
    setDays(prev => {
      const updated = [...prev]
      updated[activeDay] = { ...updated[activeDay], activities: [...(updated[activeDay].activities||[]), newAct].sort((a,b) => a.time.localeCompare(b.time)) }
      return updated
    })
    setForm(p => ({ ...p, title:'', note:'' }))
  }

  function removeActivity(actId) {
    setDays(prev => {
      const updated = [...prev]
      updated[activeDay] = { ...updated[activeDay], activities: updated[activeDay].activities.filter(a => a.id !== actId) }
      return updated
    })
  }

  function saveItinerary() {
    localStorage.setItem('travelitinerary', JSON.stringify({ tripName, startDate, numDays, days }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getDateForDay(i) {
    if (!startDate) return `Day ${i+1}`
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d.toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })
  }

  const totalActivities = days.reduce((sum,d) => sum+(d.activities?.length||0), 0)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', margin:'0 0 4px' }}>📅 Itinerary Builder</h2>
            <p style={{ color:'#888', fontSize:'14px', margin:0 }}>{totalActivities} activities planned across {numDays} days</p>
          </div>
          <button onClick={saveItinerary} style={{ padding:'10px 20px', background: saved?'#27ae60':'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            {saved ? '✅ Saved!' : '💾 Save Itinerary'}
          </button>
        </div>

        {/* Trip setup */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
            <div>
              <label style={lbl}>Trip Name</label>
              <input style={inp} placeholder="e.g. Ooty Summer 2026" value={tripName} onChange={e => setTripName(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Start Date</label>
              <input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Number of Days</label>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <button onClick={() => buildDays(Math.max(1,numDays-1))} style={cBtn}>−</button>
                <span style={{ fontWeight:'700', fontSize:'18px' }}>{numDays}</span>
                <button onClick={() => buildDays(Math.min(30,numDays+1))} style={cBtn}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'8px', marginBottom:'20px' }}>
          {Array.from({ length:numDays }, (_,i) => (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              padding:'10px 16px', borderRadius:'10px', border:'none', cursor:'pointer', whiteSpace:'nowrap',
              background: activeDay===i ? '#1e3a5f' : '#fff',
              color:      activeDay===i ? '#fff' : '#555',
              fontWeight: activeDay===i ? '700' : '400',
              fontSize:'13px', fontFamily:'Poppins,sans-serif',
              boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontWeight:'700' }}>Day {i+1}</div>
              <div style={{ fontSize:'11px', opacity:.8 }}>{getDateForDay(i)}</div>
              {days[i]?.activities?.length > 0 && (
                <div style={{ fontSize:'10px', opacity:.7 }}>{days[i].activities.length} activities</div>
              )}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start' }}>
          {/* Timeline view */}
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>
              📋 Day {activeDay+1} — {getDateForDay(activeDay)}
            </h3>

            {(!days[activeDay]?.activities || days[activeDay].activities.length === 0) && (
              <div style={{ textAlign:'center', padding:'40px', color:'#aaa' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                <p>No activities yet. Add your first one →</p>
              </div>
            )}

            {days[activeDay]?.activities?.map(act => (
              <div key={act.id} style={{
                display:'flex', gap:'14px', padding:'12px 0',
                borderBottom:'1px solid #f5f5f5', alignItems:'flex-start',
              }}>
                <div style={{ textAlign:'center', minWidth:'50px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#2980b9' }}>{act.time}</div>
                  <div style={{ fontSize:'10px', color:'#aaa', marginTop:'2px' }}>{act.duration}min</div>
                </div>
                <div style={{ width:'4px', borderRadius:'2px', background: TYPE_COLORS[act.type]||'#ddd', alignSelf:'stretch', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <span style={{ fontSize:'11px', background:(TYPE_COLORS[act.type]||'#888')+'22', color:TYPE_COLORS[act.type]||'#888', padding:'2px 8px', borderRadius:'10px', fontWeight:'600' }}>
                        {act.type}
                      </span>
                      <div style={{ fontWeight:'600', fontSize:'14px', marginTop:'4px' }}>{act.title}</div>
                      {act.note && <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>{act.note}</div>}
                    </div>
                    <button onClick={() => removeActivity(act.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:'16px', padding:'0', marginLeft:'8px' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add activity form */}
          <div style={{ position:'sticky', top:'80px', background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>➕ Add Activity</h3>
            <form onSubmit={addActivity}>
              <div style={{ marginBottom:'12px' }}>
                <label style={lbl}>Time</label>
                <select style={inp} value={form.time} onChange={e => setForm(p=>({...p,time:e.target.value}))}>
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={lbl}>Activity Type</label>
                <select style={inp} value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                  {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={lbl}>Title *</label>
                <input style={inp} placeholder="e.g. Visit Tanah Lot Temple" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={lbl}>Duration (minutes)</label>
                <input type="number" style={inp} value={form.duration} onChange={e => setForm(p=>({...p,duration:e.target.value}))} min="15" step="15" />
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={lbl}>Notes (optional)</label>
                <input style={inp} placeholder="e.g. Book tickets in advance" value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} />
              </div>
              <button type="submit" style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                ➕ Add to Day {activeDay+1}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' }
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }
const cBtn = { width:'32px', height:'32px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'18px', cursor:'pointer' }
