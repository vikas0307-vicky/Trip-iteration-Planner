// BudgetCalculatorPage.jsx - Feature 2: Smart Trip Budget Calculator
import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const CATEGORIES = [
  { key:'flights',        label:'✈️ Flights',         icon:'✈️' },
  { key:'hotel',          label:'🏨 Hotel',            icon:'🏨' },
  { key:'food',           label:'🍜 Food & Dining',    icon:'🍜' },
  { key:'transport',      label:'🚗 Local Transport',  icon:'🚗' },
  { key:'activities',     label:'🎭 Activities',       icon:'🎭' },
  { key:'shopping',       label:'🛍️ Shopping',        icon:'🛍️' },
  { key:'insurance',      label:'🛡️ Travel Insurance', icon:'🛡️' },
  { key:'miscellaneous',  label:'📦 Miscellaneous',    icon:'📦' },
]

export default function BudgetCalculatorPage() {
  const [destination, setDestination] = useState('')
  const [travelers,   setTravelers]   = useState(1)
  const [days,        setDays]        = useState(7)
  const [budget,      setBudget]      = useState({
    flights:0, hotel:0, food:0, transport:0,
    activities:0, shopping:0, insurance:0, miscellaneous:0,
  })
  const [totalBudget, setTotalBudget] = useState('')
  const [saved,       setSaved]       = useState(false)

  const totalSpent  = Object.values(budget).reduce((a,b) => a + (Number(b)||0), 0)
  const totalB      = Number(totalBudget) || 0
  const remaining   = totalB - totalSpent
  const pct         = totalB > 0 ? Math.min(100, Math.round((totalSpent / totalB) * 100)) : 0

  function setItem(key, val) {
    setBudget(p => ({ ...p, [key]: Number(val) || 0 }))
  }

  function saveToLocal() {
    localStorage.setItem('travelbudget', JSON.stringify({ destination, travelers, days, budget, totalBudget }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const barColor = pct >= 90 ? '#e74c3c' : pct >= 70 ? '#e67e22' : '#27ae60'

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', marginBottom:'6px' }}>
          💰 Budget Calculator
        </h2>
        <p style={{ color:'#888', marginBottom:'24px', fontSize:'14px' }}>
          Plan your trip expenses and track your budget
        </p>

        {/* Trip info */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>📋 Trip Info</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
            <div>
              <label style={lbl}>Destination</label>
              <input style={inp} placeholder="e.g. Ooty, India" value={destination} onChange={e => setDestination(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Total Budget (₹)</label>
              <input style={inp} type="number" placeholder="e.g. 80000" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Travelers</label>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <button onClick={() => setTravelers(t => Math.max(1,t-1))} style={counterBtn}>−</button>
                <span style={{ fontWeight:'700', fontSize:'18px' }}>{travelers}</span>
                <button onClick={() => setTravelers(t => t+1)} style={counterBtn}>+</button>
              </div>
            </div>
            <div>
              <label style={lbl}>Number of Days</label>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <button onClick={() => setDays(d => Math.max(1,d-1))} style={counterBtn}>−</button>
                <span style={{ fontWeight:'700', fontSize:'18px' }}>{days}</span>
                <button onClick={() => setDays(d => d+1)} style={counterBtn}>+</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start' }}>
          {/* Category inputs */}
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>📊 Expense Breakdown</h3>
            {CATEGORIES.map(cat => (
              <div key={cat.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'22px' }}>{cat.icon}</span>
                  <span style={{ fontSize:'14px', fontWeight:'500', color:'#333' }}>{cat.label.slice(3)}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ color:'#888', fontSize:'13px' }}>₹</span>
                  <input
                    type="number" min="0"
                    value={budget[cat.key] || ''}
                    onChange={e => setItem(cat.key, e.target.value)}
                    placeholder="0"
                    style={{ width:'110px', padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif', textAlign:'right' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary card */}
          <div style={{ position:'sticky', top:'80px' }}>
            <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
              <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>📈 Summary</h3>

              {destination && (
                <div style={{ background:'#f0f4f8', borderRadius:'10px', padding:'12px', marginBottom:'16px', fontSize:'14px', color:'#1e3a5f', fontWeight:'600' }}>
                  📍 {destination} &nbsp;·&nbsp; {travelers} person{travelers!==1?'s':''} &nbsp;·&nbsp; {days} day{days!==1?'s':''}
                </div>
              )}

              {/* Budget bar */}
              {totalB > 0 && (
                <div style={{ marginBottom:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'6px' }}>
                    <span style={{ color:'#888' }}>Used</span>
                    <span style={{ fontWeight:'600', color: barColor }}>{pct}%</span>
                  </div>
                  <div style={{ height:'10px', background:'#f0f0f0', borderRadius:'5px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:'5px', transition:'width 0.4s' }} />
                  </div>
                </div>
              )}

              {CATEGORIES.map(cat => (
                budget[cat.key] > 0 && (
                  <div key={cat.key} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f5f5f5', fontSize:'13px' }}>
                    <span style={{ color:'#666' }}>{cat.label}</span>
                    <span style={{ fontWeight:'600' }}>₹{(budget[cat.key]||0).toLocaleString()}</span>
                  </div>
                )
              ))}

              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 8px', fontSize:'16px', fontWeight:'700', color:'#1e3a5f', borderTop:'2px solid #eee', marginTop:'4px' }}>
                <span>Total Planned</span>
                <span>₹{totalSpent.toLocaleString()}</span>
              </div>

              {totalB > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', padding:'4px 0 12px', fontWeight:'600', color: remaining < 0 ? '#e74c3c' : '#27ae60' }}>
                  <span>{remaining < 0 ? '⚠️ Over budget by' : '✅ Remaining'}</span>
                  <span>₹{Math.abs(remaining).toLocaleString()}</span>
                </div>
              )}

              {days > 0 && totalSpent > 0 && (
                <div style={{ background:'#f0f8ff', borderRadius:'8px', padding:'10px', marginBottom:'14px', fontSize:'13px', color:'#2980b9', textAlign:'center' }}>
                  💡 ~₹{Math.round(totalSpent / days).toLocaleString()} per day &nbsp;·&nbsp; ~₹{Math.round(totalSpent / days / travelers).toLocaleString()} per person/day
                </div>
              )}

              <button onClick={saveToLocal} style={{
                width:'100%', padding:'12px', background: saved ? '#27ae60' : '#1e3a5f',
                color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px',
                fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif',
              }}>
                {saved ? '✅ Saved!' : '💾 Save Budget'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.04em' }
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }
const counterBtn = { width:'32px', height:'32px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'18px', cursor:'pointer' }
