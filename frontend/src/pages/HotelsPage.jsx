import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function HotelsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialSearch = new URLSearchParams(location.search).get('search') || ''
  const [hotels, setHotels]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState(initialSearch)
  const [category, setCategory] = useState('All')
  const [state, setState]       = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const STATES = ['All','Goa','Rajasthan','Kerala','Himachal Pradesh','Delhi','Tamil Nadu','Karnataka','Uttarakhand','Maharashtra','Meghalaya','Uttar Pradesh','Madhya Pradesh','Andaman & Nicobar','West Bengal','Ladakh','Punjab','Gujarat','Odisha']

  function loadHotels() {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (category && category !== 'All') params.category = category
    if (state && state !== 'All') params.state = state
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    axios.get(`${API}/hotels`, { params })
      .then(r => setHotels(r.data.hotels))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadHotels() }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', marginBottom:'20px' }}>🏨 Find Hotels Across India</h2>

        {/* Search Bar */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
          <input
            style={{ flex:1, padding:'12px 16px', border:'1.5px solid #ddd', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            placeholder="🔍 Search by hotel name, city, or Indian state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadHotels()}
          />
          <button onClick={loadHotels} style={{ padding:'12px 24px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Search</button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'20px', flexWrap:'wrap', background:'#fff', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div>
            <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'600', color:'#444', textTransform:'uppercase' }}>Category</p>
            <div style={{ display:'flex', gap:'8px' }}>
              {['All','Budget','Standard','Luxury'].map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ padding:'6px 14px', borderRadius:'20px', border:'1.5px solid', borderColor:category===c?'#1e3a5f':'#ddd', background:category===c?'#1e3a5f':'#fff', color:category===c?'#fff':'#555', cursor:'pointer', fontSize:'13px', fontFamily:'Poppins,sans-serif' }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'600', color:'#444', textTransform:'uppercase' }}>Indian State</p>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              style={{ padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', background:'#fff', color:'#444', minWidth:'180px' }}
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'600', color:'#444', textTransform:'uppercase' }}>Price (₹/night)</p>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input style={{ width:'80px', padding:'8px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none' }} type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span>—</span>
              <input style={{ width:'80px', padding:'8px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none' }} type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              <button onClick={loadHotels} style={{ padding:'8px 14px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Apply</button>
              <button onClick={() => { setSearch(''); setCategory('All'); setState('All'); setMinPrice(''); setMaxPrice(''); setTimeout(loadHotels,100) }} style={{ padding:'8px 14px', background:'#fff', color:'#888', border:'1.5px solid #ddd', borderRadius:'8px', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Clear</button>
            </div>
          </div>
        </div>

        <p style={{ color:'#888', fontSize:'14px', marginBottom:'16px' }}>{loading ? 'Loading...' : `${hotels.length} hotel(s) found`}</p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'20px' }}>
          {hotels.map(hotel => {
            const catColor = { Budget:'#27ae60', Standard:'#2980b9', Luxury:'#8e44ad' }[hotel.category] || '#888'
            return (
              <div key={hotel._id} onClick={() => navigate(`/hotels/${hotel._id}`)}
                style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', cursor:'pointer', transition:'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='none'}>
                <div style={{ height:'150px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  <span style={{ fontSize:'48px' }}>🏨</span>
                  <span style={{ position:'absolute', top:'10px', right:'10px', background:catColor, color:'#fff', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'10px' }}>{hotel.category}</span>
                </div>
                <div style={{ padding:'16px' }}>
                  <h3 style={{ margin:'0 0 4px', fontSize:'16px', color:'#1e3a5f' }}>{hotel.name}</h3>
                  <p style={{ margin:'0 0 6px', color:'#888', fontSize:'13px' }}>📍 {hotel.location}</p>
                  <p style={{ margin:'0 0 10px', color:'#555', fontSize:'13px' }}>{hotel.description?.slice(0,75)}...</p>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'12px' }}>
                    {hotel.amenities?.slice(0,3).map(a => <span key={a} style={{ background:'#ebf5fb', color:'#2980b9', borderRadius:'6px', padding:'2px 8px', fontSize:'11px' }}>{a}</span>)}
                  </div>
                  <p style={{ margin:'0 0 10px', color:'#27ae60', fontSize:'12px', fontWeight:'700' }}>{hotel.rooms || 1} rooms available to book</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'14px', color:'#888' }}>{'⭐'.repeat(Math.floor(hotel.rating))} {hotel.rating}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'18px', fontWeight:'700', color:'#1e3a5f' }}>₹{hotel.price?.toLocaleString()}</div>
                      <div style={{ fontSize:'11px', color:'#888' }}>per night</div>
                    </div>
                  </div>
                  <button style={{ width:'100%', marginTop:'12px', padding:'10px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>View & Book</button>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && hotels.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px' }}>
            <p style={{ fontSize:'40px' }}>🏨</p>
            <p style={{ color:'#888' }}>No hotels found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
