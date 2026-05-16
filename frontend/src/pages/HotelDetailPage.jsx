import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function HotelDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const [hotel, setHotel] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [roomsBooked, setRoomsBooked] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    axios.get(`${API}/hotels/${id}`).then(r => setHotel(r.data.hotel)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (hotel && location.hash === '#booking') {
      document.getElementById('booking-section')?.scrollIntoView({ behavior:'smooth', block:'start' })
    }
  }, [hotel, location.hash])

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0
  const roomOptions = hotel?.roomOptions?.length
    ? hotel.roomOptions
    : [{
        id: 'classic',
        type: 'Classic Room',
        view: 'City view',
        sleeps: 2,
        available: hotel?.rooms || 1,
        price: hotel?.price || 0,
        perks: ['WiFi', 'Breakfast'],
      }]
  const selectedRoom = roomOptions.find(room => room.id === selectedRoomId) || roomOptions[0]
  const total = selectedRoom ? nights * selectedRoom.price * roomsBooked : 0

  async function handleBook() {
    if (!checkIn || !checkOut) return setMsg('Please select check-in and check-out dates')
    if (!selectedRoom) return setMsg('Please select a room')
    setLoading(true)
    try {
      const r = await axios.post(`${API}/bookings`, {
        hotelId: id,
        checkIn,
        checkOut,
        guests,
        roomId: selectedRoom.id,
        roomsBooked,
      }, { headers: { authorization: token } })
      navigate(`/payment/${r.data.booking._id}`)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  if (!hotel) return <div style={{ fontFamily:'Poppins,sans-serif', padding:'40px', textAlign:'center' }}>Loading hotel...</div>

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <button onClick={() => navigate('/hotels')} style={{ background:'none', border:'none', color:'#2980b9', fontSize:'14px', cursor:'pointer', marginBottom:'16px', fontFamily:'Poppins,sans-serif' }}>Back to Hotels</button>

        <div style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ height:'220px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'118px', height:'118px', borderRadius:'28px', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 18px 38px rgba(0,0,0,0.22)', border:'1px solid rgba(255,255,255,0.45)' }}>
              <div style={{ width:'62px', height:'58px', borderRadius:'10px 10px 6px 6px', background:'#1e3a5f', position:'relative', boxShadow:'inset 0 -7px 0 rgba(255,255,255,0.12)' }}>
                <div style={{ position:'absolute', top:'-18px', left:'18px', width:'26px', height:'18px', borderRadius:'6px 6px 0 0', background:'#2980b9' }} />
                {[8, 26, 44].map(left => (
                  <div key={`top-${left}`} style={{ position:'absolute', top:'12px', left, width:'9px', height:'9px', borderRadius:'2px', background:'#e8f4fd' }} />
                ))}
                {[8, 44].map(left => (
                  <div key={`bottom-${left}`} style={{ position:'absolute', top:'30px', left, width:'9px', height:'9px', borderRadius:'2px', background:'#e8f4fd' }} />
                ))}
                <div style={{ position:'absolute', bottom:0, left:'25px', width:'13px', height:'22px', borderRadius:'4px 4px 0 0', background:'#f7c948' }} />
              </div>
              <div style={{ marginTop:'10px', color:'#1e3a5f', fontSize:'14px', fontWeight:'800', letterSpacing:'0.8px' }}>HOTEL</div>
            </div>
          </div>

          <div style={{ padding:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:'24px', color:'#1e3a5f' }}>{hotel.name}</h1>
                <p style={{ margin:'0 0 4px', color:'#888' }}>{hotel.location}</p>
                <p style={{ margin:0, color:'#888' }}>{hotel.rating} rating</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'28px', fontWeight:'700', color:'#1e3a5f' }}>Rs {hotel.price?.toLocaleString()}</div>
                <div style={{ color:'#888', fontSize:'14px' }}>starting per night</div>
              </div>
            </div>

            <p style={{ marginTop:'16px', color:'#555', lineHeight:'1.7' }}>{hotel.description}</p>

            <div style={{ marginTop:'16px' }}>
              <p style={{ fontWeight:'600', color:'#444', marginBottom:'8px' }}>Amenities</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {hotel.amenities?.map(a => <span key={a} style={{ background:'#ebf5fb', color:'#2980b9', borderRadius:'8px', padding:'5px 12px', fontSize:'13px', fontWeight:'500' }}>{a}</span>)}
              </div>
            </div>

            <div id="booking-section" style={{ marginTop:'24px', background:'#f8fafc', borderRadius:'12px', padding:'20px' }}>
              <h3 style={{ margin:'0 0 16px', color:'#1e3a5f' }}>Book Your Stay</h3>
              {msg && <div style={{ background:'#ffeaea', color:'#c0392b', padding:'10px', borderRadius:'8px', marginBottom:'12px', fontSize:'13px' }}>{msg}</div>}

              <div style={{ marginBottom:'18px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#444', display:'block', marginBottom:'8px' }}>Available rooms</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'12px' }}>
                  {roomOptions.map(room => {
                    const active = selectedRoom?.id === room.id
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoomId(room.id)
                          setRoomsBooked(count => Math.min(count, room.available))
                        }}
                        style={{ textAlign:'left', background:active?'#e8f4fd':'#fff', border:`2px solid ${active?'#2980b9':'#e5eaf0'}`, borderRadius:'12px', padding:'14px', cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:active?'0 6px 18px rgba(41,128,185,0.14)':'none' }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', alignItems:'flex-start' }}>
                          <div>
                            <div style={{ color:'#1e3a5f', fontWeight:'700', fontSize:'15px' }}>{room.type}</div>
                            <div style={{ color:'#64748b', fontSize:'12px', marginTop:'3px' }}>{room.view} . Sleeps {room.sleeps}</div>
                          </div>
                          <span style={{ background:room.available > 3 ? '#eafaf1' : '#fff3cd', color:room.available > 3 ? '#1e8449' : '#856404', borderRadius:'20px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap' }}>
                            {room.available} left
                          </span>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', margin:'10px 0' }}>
                          {room.perks?.map(perk => <span key={perk} style={{ background:'#f1f5f9', color:'#475569', borderRadius:'6px', padding:'2px 7px', fontSize:'11px' }}>{perk}</span>)}
                        </div>
                        <div style={{ color:'#1e3a5f', fontSize:'18px', fontWeight:'800' }}>Rs {room.price?.toLocaleString()} <span style={{ color:'#888', fontSize:'11px', fontWeight:'500' }}>/ night</span></div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                <div>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#444', display:'block', marginBottom:'6px' }}>Check-in</label>
                  <input type="date" style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box' }} value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#444', display:'block', marginBottom:'6px' }}>Check-out</label>
                  <input type="date" style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box' }} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                <div>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#444', display:'block', marginBottom:'6px' }}>Guests</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                    <button type="button" onClick={() => setGuests(g => Math.max(1,g-1))} style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'20px', cursor:'pointer' }}>-</button>
                    <span style={{ fontSize:'18px', fontWeight:'700' }}>{guests}</span>
                    <button type="button" onClick={() => setGuests(g => g+1)} style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'20px', cursor:'pointer' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#444', display:'block', marginBottom:'6px' }}>Rooms</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                    <button type="button" onClick={() => setRoomsBooked(r => Math.max(1,r-1))} style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'20px', cursor:'pointer' }}>-</button>
                    <span style={{ fontSize:'18px', fontWeight:'700' }}>{roomsBooked}</span>
                    <button type="button" onClick={() => setRoomsBooked(r => Math.min(selectedRoom?.available || 1,r+1))} style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1.5px solid #ddd', background:'#fff', fontSize:'20px', cursor:'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              {nights > 0 && (
                <div style={{ background:'#e8f4fd', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', color:'#555', marginBottom:'4px', gap:'12px' }}>
                    <span>{selectedRoom?.type} . Rs {selectedRoom?.price?.toLocaleString()} x {nights} night{nights!==1?'s':''} x {roomsBooked} room{roomsBooked!==1?'s':''}</span>
                    <span>Rs {total.toLocaleString()}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'700', fontSize:'16px', color:'#1e3a5f' }}>
                    <span>Total</span><span>Rs {total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button onClick={handleBook} disabled={loading} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#27ae60,#2ecc71)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                {loading ? 'Booking...' : 'Book Now - Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
