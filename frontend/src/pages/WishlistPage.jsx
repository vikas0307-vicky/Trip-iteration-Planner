import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const CATEGORIES = ['Beach','Mountain','Heritage','Wildlife','Adventure','Pilgrimage','Nature','City']
const CAT_ICONS = {
  Beach:'🏖️', Mountain:'🏔️', Heritage:'🏰', Wildlife:'🐯',
  Adventure:'🧗', Pilgrimage:'⛩️', Nature:'🌿', City:'🌆',
}

const INDIA_DESTINATIONS = [
  { name:'Goa', state:'Goa', category:'Beach', img:'🏖️', description:'Golden beaches, nightlife, churches, and coastal food' },
  { name:'Manali', state:'Himachal Pradesh', category:'Mountain', img:'🏔️', description:'Snow peaks, Solang Valley, temples, and adventure sports' },
  { name:'Kerala Backwaters', state:'Kerala', category:'Nature', img:'🚤', description:'Houseboats, canals, coconut groves, and calm backwater stays' },
  { name:'Jaipur', state:'Rajasthan', category:'Heritage', img:'🏰', description:'Amer Fort, Hawa Mahal, royal culture, and colorful bazaars' },
  { name:'Varanasi', state:'Uttar Pradesh', category:'Pilgrimage', img:'🪔', description:'Ghats, Ganga Aarti, Kashi Vishwanath Temple, and spiritual lanes' },
  { name:'Darjeeling', state:'West Bengal', category:'Mountain', img:'🍃', description:'Tea gardens, toy train, Tiger Hill, and Himalayan views' },
  { name:'Agra', state:'Uttar Pradesh', category:'Heritage', img:'🕌', description:'Taj Mahal, Agra Fort, Fatehpur Sikri, and Mughal architecture' },
  { name:'Andaman Islands', state:'Andaman & Nicobar', category:'Beach', img:'🌊', description:'Radhanagar Beach, coral reefs, Cellular Jail, and scuba diving' },
  { name:'Rishikesh', state:'Uttarakhand', category:'Adventure', img:'🚣', description:'River rafting, yoga, Ganga Aarti, and Himalayan gateways' },
  { name:'Udaipur', state:'Rajasthan', category:'Heritage', img:'🏛️', description:'Lake Pichola, City Palace, royal stays, and sunset boat rides' },
  { name:'Coorg', state:'Karnataka', category:'Nature', img:'☕', description:'Coffee estates, waterfalls, misty hills, and forest trails' },
  { name:'Spiti Valley', state:'Himachal Pradesh', category:'Adventure', img:'🏜️', description:'Cold desert, monasteries, Chandratal Lake, and high passes' },
  { name:'Mysore', state:'Karnataka', category:'Heritage', img:'🏯', description:'Mysore Palace, Dasara, sandalwood markets, and gardens' },
  { name:'Leh Ladakh', state:'Ladakh', category:'Adventure', img:'⛰️', description:'Pangong Lake, Nubra Valley, monasteries, and mountain roads' },
  { name:'Munnar', state:'Kerala', category:'Nature', img:'🌱', description:'Tea estates, waterfalls, Eravikulam National Park, and cool hills' },
  { name:'Hampi', state:'Karnataka', category:'Heritage', img:'🪨', description:'UNESCO ruins, stone chariot, temples, and boulder landscapes' },
  { name:'Ooty', state:'Tamil Nadu', category:'Nature', img:'🚂', description:'Toy train, botanical gardens, Ooty Lake, and Nilgiri views' },
  { name:'Jim Corbett', state:'Uttarakhand', category:'Wildlife', img:'🐯', description:'Tiger safari, forest lodges, elephants, and wildlife trails' },
  { name:'Amritsar', state:'Punjab', category:'Pilgrimage', img:'🛕', description:'Golden Temple, Wagah Border, Jallianwala Bagh, and Punjabi food' },
  { name:'Kolkata', state:'West Bengal', category:'City', img:'🌉', description:'Victoria Memorial, Howrah Bridge, art, culture, and street food' },
  { name:'Khajuraho', state:'Madhya Pradesh', category:'Heritage', img:'🛕', description:'Temple sculptures, light shows, heritage walks, and nearby Panna' },
  { name:'Rann of Kutch', state:'Gujarat', category:'Nature', img:'🤍', description:'White salt desert, Rann Utsav, handicrafts, and desert sunsets' },
  { name:'Shillong', state:'Meghalaya', category:'Nature', img:'🌧️', description:'Waterfalls, living root bridges, misty hills, and music culture' },
  { name:'Jaisalmer', state:'Rajasthan', category:'Adventure', img:'🐪', description:'Golden Fort, desert camps, camel safari, and Thar dunes' },
  { name:'Puri', state:'Odisha', category:'Pilgrimage', img:'🌅', description:'Jagannath Temple, Puri Beach, Chilika Lake, and Konark nearby' },
]

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('travelwishlist') || '[]') } catch { return [] }
  })
  const [form, setForm] = useState({ name:'', state:'', category:'Beach', description:'', priority:'Medium' })
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)

  function save(list) {
    setWishlist(list)
    localStorage.setItem('travelwishlist', JSON.stringify(list))
  }

  function addItem(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const item = { ...form, id:Date.now(), visited:false, addedDate:new Date().toLocaleDateString() }
    save([item, ...wishlist])
    setForm({ name:'', state:'', category:'Beach', description:'', priority:'Medium' })
    setShowForm(false)
  }

  function addFromSample(dest) {
    if (wishlist.find(w => w.name === dest.name)) return
    const item = { ...dest, id:Date.now(), visited:false, priority:'Medium', addedDate:new Date().toLocaleDateString() }
    save([item, ...wishlist])
  }

  function toggleVisited(id) {
    save(wishlist.map(w => w.id === id ? { ...w, visited:!w.visited } : w))
  }

  function removeItem(id) {
    save(wishlist.filter(w => w.id !== id))
  }

  const filtered = filter === 'All'
    ? wishlist
    : filter === 'Visited'
      ? wishlist.filter(w => w.visited)
      : filter === 'Pending'
        ? wishlist.filter(w => !w.visited)
        : wishlist.filter(w => w.category === filter)
  const visited = wishlist.filter(w => w.visited).length
  const pct = wishlist.length > 0 ? Math.round((visited / wishlist.length) * 100) : 0

  const PRIORITY_COLORS = { High:'#e74c3c', Medium:'#e67e22', Low:'#27ae60' }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px', marginBottom:'20px' }}>
          <div>
            <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', margin:'0 0 4px' }}>🇮🇳 India Travel Wishlist</h2>
            <p style={{ color:'#888', fontSize:'14px', margin:0 }}>
              {visited}/{wishlist.length} India places visited · {pct}% complete
            </p>
          </div>
          <button onClick={() => setShowForm(s => !s)} style={{ padding:'10px 20px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            {showForm ? 'Cancel' : '+ Add India Place'}
          </button>
        </div>

        {wishlist.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#888', marginBottom:'8px' }}>
              <span>India bucket list progress</span>
              <span style={{ fontWeight:'700', color:'#1e3a5f' }}>{visited} of {wishlist.length} visited</span>
            </div>
            <div style={{ height:'10px', background:'#f0f0f0', borderRadius:'5px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#ff9933,#138808)', borderRadius:'5px', transition:'width 0.4s' }} />
            </div>
          </div>
        )}

        {showForm && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', border:'2px solid #1e3a5f' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 18px' }}>Add India Place</h3>
            <form onSubmit={addItem}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div>
                  <label style={lbl}>Place Name *</label>
                  <input style={inp} placeholder="e.g. Munnar" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <input style={inp} placeholder="e.g. Kerala" value={form.state} onChange={e => setForm(p=>({...p,state:e.target.value}))} />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={inp} value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select style={inp} value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
                    {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Description</label>
                  <input style={inp} placeholder="Why do you want to visit?" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                </div>
              </div>
              <button type="submit" style={{ marginTop:'16px', padding:'12px 24px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                Add to Wishlist
              </button>
            </form>
          </div>
        )}

        {wishlist.length === 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'15px' }}>Popular India Places to Add</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'10px' }}>
              {INDIA_DESTINATIONS.map(d => (
                <div key={d.name} onClick={() => addFromSample(d)} style={{ padding:'12px', borderRadius:'10px', border:'1.5px dashed #ddd', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.background='#f0f4f8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.background='#fff' }}>
                  <div style={{ fontSize:'30px', marginBottom:'6px' }}>{d.img}</div>
                  <div style={{ fontWeight:'600', fontSize:'13px', color:'#1e3a5f' }}>{d.name}</div>
                  <div style={{ fontSize:'11px', color:'#888' }}>{d.state}</div>
                  <div style={{ marginTop:'6px', fontSize:'11px', color:'#2980b9', fontWeight:'600' }}>+ Add to wishlist</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
          {['All','Pending','Visited',...CATEGORIES].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:'20px', border:'1.5px solid',
              borderColor: filter===f ? '#1e3a5f' : '#ddd',
              background: filter===f ? '#1e3a5f' : '#fff',
              color: filter===f ? '#fff' : '#555',
              cursor:'pointer', fontSize:'12px', fontWeight:'500', fontFamily:'Poppins,sans-serif',
            }}>{CAT_ICONS[f] || ''} {f}</button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'50px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:'50px', marginBottom:'12px' }}>🇮🇳</div>
            <p style={{ color:'#888' }}>No India places found. Add your dream places!</p>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', opacity:item.visited ? 0.8 : 1, border:item.visited ? '2px solid #27ae60' : '2px solid transparent', transition:'all 0.2s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <div style={{ fontSize:'32px' }}>{item.img || CAT_ICONS[item.category] || '🇮🇳'}</div>
                  <div>
                    <div style={{ fontWeight:'700', fontSize:'16px', color:'#1e3a5f', textDecoration:item.visited ? 'line-through' : 'none' }}>{item.name}</div>
                    <div style={{ fontSize:'12px', color:'#888' }}>{item.state || item.country || 'India'}</div>
                  </div>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:(PRIORITY_COLORS[item.priority] || '#e67e22')+'22', color:PRIORITY_COLORS[item.priority] || '#e67e22' }}>
                  {item.priority}
                </span>
              </div>

              {item.description && <p style={{ color:'#666', fontSize:'13px', lineHeight:'1.5', marginBottom:'12px' }}>{item.description}</p>}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <span style={{ background:'#f0f4f8', color:'#2980b9', fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'10px' }}>
                  {CAT_ICONS[item.category]} {item.category}
                </span>
                <span style={{ fontSize:'11px', color:'#aaa' }}>Added {item.addedDate}</span>
              </div>

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => toggleVisited(item.id)} style={{
                  flex:1, padding:'9px', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', fontFamily:'Poppins,sans-serif',
                  background:item.visited ? '#eafaf1' : '#e8f4fd',
                  color:item.visited ? '#27ae60' : '#2980b9',
                }}>
                  {item.visited ? 'Visited' : 'Mark Visited'}
                </button>
                <button onClick={() => removeItem(item.id)} style={{ padding:'9px 14px', background:'#ffeaea', color:'#e74c3c', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'Poppins,sans-serif' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:'12px', fontWeight:'600', color:'#555', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' }
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }
