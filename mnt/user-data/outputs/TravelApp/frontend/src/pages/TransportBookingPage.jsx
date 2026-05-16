import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

const PLACES = [
  'Goa','Manali','Kerala Backwaters','Jaipur','Varanasi','Darjeeling','Agra','Andaman Islands',
  'Rishikesh','Udaipur','Coorg','Spiti Valley','Mysore','Leh Ladakh','Munnar','Hampi','Ooty',
  'Jim Corbett','Amritsar','Kolkata','Khajuraho','Rann of Kutch','Shillong','Jaisalmer','Puri',
]

const MODES = {
  Flight: { icon:'✈️', base:4200, perPassenger:2200, providers:['IndiGo','Air India','Vistara Connect'] },
  Train:  { icon:'🚆', base:900,  perPassenger:650,  providers:['Rajdhani Express','Shatabdi Express','Vande Bharat'] },
  Bus:    { icon:'🚌', base:500,  perPassenger:450,  providers:['Volvo AC','Sleeper Coach','State Express'] },
}

const CLASS_MULTIPLIER = {
  Economy: 1,
  Premium: 1.35,
  Business: 1.9,
  Sleeper: 1.15,
}

const SEAT_OPTIONS = {
  Flight: [
    { id:'window', label:'Window Seat', code:'12A', available:18, extra:350, perks:['Window','Cabin bag'] },
    { id:'aisle', label:'Aisle Seat', code:'14C', available:22, extra:250, perks:['Aisle','Quick exit'] },
    { id:'extra-legroom', label:'Extra Legroom', code:'6F', available:8, extra:900, perks:['More space','Priority'] },
  ],
  Train: [
    { id:'lower', label:'Lower Berth', code:'B2-21', available:16, extra:180, perks:['Lower','Easy access'] },
    { id:'window-chair', label:'Window Chair', code:'C1-08', available:24, extra:120, perks:['Window','Charging'] },
    { id:'coupe', label:'Private Coupe', code:'H1-02', available:5, extra:750, perks:['Private','Quiet'] },
  ],
  Bus: [
    { id:'single-sleeper', label:'Single Sleeper', code:'U7', available:10, extra:220, perks:['Sleeper','Curtain'] },
    { id:'window-seat', label:'Window Seat', code:'W12', available:18, extra:100, perks:['Window','AC'] },
    { id:'front-seat', label:'Front Seat', code:'F3', available:6, extra:160, perks:['Front','Fast exit'] },
  ],
}

export default function TransportBookingPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [mode, setMode] = useState('Flight')
  const [source, setSource] = useState('Delhi')
  const [destination, setDestination] = useState('Goa')
  const [travelDate, setTravelDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [seatClass, setSeatClass] = useState('Economy')
  const [selectedSeatId, setSelectedSeatId] = useState(SEAT_OPTIONS.Flight[0].id)
  const [provider, setProvider] = useState(MODES.Flight.providers[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sourcePlaces = ['Delhi','Mumbai','Bangalore','Chennai','Hyderabad','Kolkata','Pune','Ahmedabad', ...PLACES]
  const seatOptions = SEAT_OPTIONS[mode]
  const selectedSeat = seatOptions.find(seat => seat.id === selectedSeatId) || seatOptions[0]

  const total = useMemo(() => {
    const config = MODES[mode]
    return Math.round((config.base + (config.perPassenger + selectedSeat.extra) * passengers) * (CLASS_MULTIPLIER[seatClass] || 1))
  }, [mode, passengers, seatClass, selectedSeat])

  function changeMode(nextMode) {
    setMode(nextMode)
    setProvider(MODES[nextMode].providers[0])
    setSeatClass(nextMode === 'Bus' ? 'Sleeper' : 'Economy')
    setSelectedSeatId(SEAT_OPTIONS[nextMode][0].id)
  }

  async function bookTransport() {
    if (!travelDate) return setError('Please select a travel date')
    if (source === destination) return setError('Source and destination cannot be same')
    if (passengers > selectedSeat.available) return setError('Not enough seats available for this option')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/transport-bookings`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', authorization:token },
        body:JSON.stringify({
          transportMode:mode,
          source,
          destination,
          travelDate,
          passengers,
          seatClass,
          provider,
          totalPrice:total,
          seatType:selectedSeat.label,
          seatNumber:selectedSeat.code,
          seatPrice:selectedSeat.extra,
          seatsBooked:passengers,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Booking failed')
      navigate(`/payment/${data.booking._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'980px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ margin:'0 0 6px', fontSize:'24px', color:'#1e3a5f' }}>🎫 India Travel Booking</h2>
        <p style={{ margin:'0 0 24px', color:'#888', fontSize:'14px' }}>Book flights, trains, and buses to Incredible India destinations</p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
          {Object.keys(MODES).map(m => (
            <button key={m} onClick={() => changeMode(m)} style={{ padding:'18px', background:mode===m?'#1e3a5f':'#fff', color:mode===m?'#fff':'#1e3a5f', border:'1.5px solid #d8e2ec', borderRadius:'12px', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:'800', fontSize:'15px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'30px', marginBottom:'6px' }}>{MODES[m].icon}</div>
              {m}
            </button>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
          {error && <div style={{ background:'#ffeaea', color:'#c0392b', padding:'10px 12px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px' }}>{error}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', marginBottom:'16px' }}>
            <Field label="Source">
              <select value={source} onChange={e=>setSource(e.target.value)} style={inputStyle}>
                {sourcePlaces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Destination">
              <select value={destination} onChange={e=>setDestination(e.target.value)} style={inputStyle}>
                {PLACES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Travel Date">
              <input type="date" value={travelDate} onChange={e=>setTravelDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Passengers">
              <input type="number" min="1" max="8" value={passengers} onChange={e=>setPassengers(Math.max(1, Number(e.target.value || 1)))} style={inputStyle} />
            </Field>
            <Field label="Class">
              <select value={seatClass} onChange={e=>setSeatClass(e.target.value)} style={inputStyle}>
                {(mode === 'Bus' ? ['Sleeper','Economy','Premium'] : ['Economy','Premium','Business']).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Operator">
              <select value={provider} onChange={e=>setProvider(e.target.value)} style={inputStyle}>
                {MODES[mode].providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'12px', color:'#444', fontWeight:'700', textTransform:'uppercase', marginBottom:'8px' }}>
              Available seats
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'12px' }}>
              {seatOptions.map(seat => {
                const active = selectedSeat.id === seat.id
                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => setSelectedSeatId(seat.id)}
                    style={{ textAlign:'left', background:active?'#e8f4fd':'#fff', border:`2px solid ${active?'#2980b9':'#e5eaf0'}`, borderRadius:'12px', padding:'14px', cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:active?'0 6px 18px rgba(41,128,185,0.14)':'none' }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ color:'#1e3a5f', fontWeight:'800', fontSize:'15px' }}>{seat.label}</div>
                        <div style={{ color:'#64748b', fontSize:'12px', marginTop:'3px' }}>Seat {seat.code}</div>
                      </div>
                      <span style={{ background:seat.available > 8 ? '#eafaf1' : '#fff3cd', color:seat.available > 8 ? '#1e8449' : '#856404', borderRadius:'20px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap' }}>
                        {seat.available} left
                      </span>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', margin:'10px 0' }}>
                      {seat.perks.map(perk => <span key={perk} style={{ background:'#f1f5f9', color:'#475569', borderRadius:'6px', padding:'2px 7px', fontSize:'11px' }}>{perk}</span>)}
                    </div>
                    <div style={{ color:'#1e3a5f', fontSize:'16px', fontWeight:'800' }}>
                      + Rs {seat.extra.toLocaleString()} <span style={{ color:'#888', fontSize:'11px', fontWeight:'500' }}>/ passenger</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ background:'#f8fafc', border:'1px solid #e6edf5', borderRadius:'12px', padding:'16px', marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', color:'#555', fontSize:'14px', marginBottom:'6px' }}>
              <span>{MODES[mode].icon} {provider}</span>
              <span>{source} → {destination}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#888', fontSize:'13px' }}>{passengers} passenger{passengers!==1?'s':''} . {seatClass} . {selectedSeat.label} ({selectedSeat.code})</span>
              <span style={{ color:'#1e3a5f', fontSize:'26px', fontWeight:'800' }}>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={bookTransport} disabled={loading} style={{ width:'100%', padding:'14px', background:loading?'#aaa':'linear-gradient(135deg,#27ae60,#2ecc71)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'800', cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}>
            {loading ? 'Booking...' : 'Book Now & Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'12px', color:'#444', fontWeight:'700', textTransform:'uppercase', marginBottom:'6px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width:'100%',
  padding:'11px 12px',
  border:'1.5px solid #ddd',
  borderRadius:'9px',
  fontSize:'14px',
  outline:'none',
  boxSizing:'border-box',
  fontFamily:'Poppins,sans-serif',
  background:'#fff',
}
