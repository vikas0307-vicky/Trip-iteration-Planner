import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

const CAT_ICONS = { Beach:'🏖️', Mountain:'🏔️', Heritage:'🏰', Wildlife:'🐯', Adventure:'🧗', Pilgrimage:'⛩️', Nature:'🌿', City:'🌆' }
const SEA_ICONS = { Summer:'☀️', Winter:'❄️', Monsoon:'🌧️', 'All Year':'🌍' }
const SEA_COLORS = { Summer:'#e67e22', Winter:'#2980b9', Monsoon:'#27ae60', 'All Year':'#8e44ad' }

export default function IndiaPage() {
  const navigate = useNavigate()
  const [dests,    setDests]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [season,   setSeason]   = useState('All')
  const [category, setCategory] = useState('All')
  const [search,   setSearch]   = useState('')

  const seasons    = ['All','Summer','Winter','Monsoon']
  const categories = ['All','Beach','Mountain','Heritage','Wildlife','Adventure','Pilgrimage','Nature','City']

  function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (season   !== 'All') p.set('season',   season)
    if (category !== 'All') p.set('category', category)
    if (search.trim())      p.set('search',   search)
    fetch(`${API}/india-destinations?${p}`)
      .then(r=>r.json()).then(d=>setDests(d.destinations||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [season, category])

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#ff9933 0%,#fff 50%,#138808 100%)', borderRadius:'18px', padding:'30px', marginBottom:'24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
          <div style={{ position:'relative', color:'#fff' }}>
            <h1 style={{ fontSize:'28px', fontWeight:'700', margin:'0 0 8px' }}>🇮🇳 Incredible India</h1>
            <p style={{ fontSize:'15px', opacity:.9, margin:'0 0 20px' }}>{dests.length} destinations across India — beaches, mountains, heritage & more</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
              <input
                style={{ padding:'11px 18px', borderRadius:'10px', border:'none', fontSize:'14px', width:'280px', fontFamily:'Poppins,sans-serif', outline:'none' }}
                placeholder="🔍 Search destinations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key==='Enter' && load()}
              />
              <button onClick={load} style={{ padding:'11px 22px', background:'#ff9933', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Search</button>
            </div>
          </div>
        </div>

        {/* Season filter */}
        <div style={{ marginBottom:'16px' }}>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'#555', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Filter by Season</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {seasons.map(s => (
              <button key={s} onClick={() => setSeason(s)} style={{
                padding:'8px 18px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:'600', fontSize:'13px',
                borderColor: season===s ? (SEA_COLORS[s]||'#1e3a5f') : '#ddd',
                background:  season===s ? (SEA_COLORS[s]||'#1e3a5f') : '#fff',
                color:       season===s ? '#fff' : '#555',
              }}>{SEA_ICONS[s]||'🌍'} {s}</button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ marginBottom:'24px' }}>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'#555', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Filter by Type</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding:'7px 16px', borderRadius:'20px', border:'1.5px solid', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:'500', fontSize:'13px',
                borderColor: category===c ? '#1e3a5f' : '#ddd',
                background:  category===c ? '#1e3a5f' : '#fff',
                color:       category===c ? '#fff' : '#555',
              }}>{CAT_ICONS[c]||''} {c}</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', padding:'60px', color:'#888' }}>⏳ Loading destinations...</div>}

        {!loading && dests.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', background:'#fff', borderRadius:'14px' }}>
            <div style={{ fontSize:'50px' }}>🔍</div>
            <p style={{ color:'#888', marginTop:'12px' }}>No destinations found. Try different filters!</p>
          </div>
        )}

        {/* Destination grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px' }}>
          {dests.map(d => (
            <div key={d._id} onClick={() => navigate(`/india/${d._id}`)}
              style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', cursor:'pointer', transition:'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>

              {/* Gradient header */}
              <div style={{ height:'130px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                <div style={{ fontSize:'56px' }}>{CAT_ICONS[d.category]||'🌍'}</div>
                <div style={{ position:'absolute', top:'10px', right:'10px', display:'flex', gap:'5px', flexWrap:'wrap' }}>
                  {d.bestSeason?.map(s => (
                    <span key={s} style={{ background:SEA_COLORS[s]||'#888', color:'#fff', fontSize:'10px', fontWeight:'700', padding:'3px 8px', borderRadius:'10px' }}>{SEA_ICONS[s]} {s}</span>
                  ))}
                </div>
              </div>

              <div style={{ padding:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                  <div>
                    <h3 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#1e3a5f' }}>{d.name}</h3>
                    <p style={{ margin:'2px 0 0', color:'#888', fontSize:'13px' }}>📍 {d.state}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:'700', color:'#f39c12', fontSize:'15px' }}>⭐ {d.rating}</div>
                    <div style={{ fontSize:'11px', color:'#888' }}>/5.0</div>
                  </div>
                </div>

                <p style={{ color:'#666', fontSize:'13px', lineHeight:'1.5', margin:'0 0 10px' }}>{d.description?.slice(0,90)}...</p>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ background:('#ebf5fb'), color:'#2980b9', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'10px' }}>
                    {CAT_ICONS[d.category]} {d.category}
                  </span>
                  <span style={{ color:'#27ae60', fontWeight:'700', fontSize:'14px' }}>💰 ₹{d.avgBudgetPerDay?.toLocaleString()}<span style={{ color:'#888', fontWeight:'400', fontSize:'11px' }}>/day</span></span>
                </div>

                {d.topAttractions?.length > 0 && (
                  <div style={{ marginTop:'10px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {d.topAttractions.slice(0,3).map(a => (
                      <span key={a} style={{ background:'#f8f9fa', color:'#555', fontSize:'10px', padding:'3px 8px', borderRadius:'6px', border:'1px solid #eee' }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}