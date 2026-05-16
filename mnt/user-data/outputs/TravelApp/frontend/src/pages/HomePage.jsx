import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

const CAT_COLORS = {
  Beach: '#0ea5e9',
  Mountain: '#6366f1',
  Heritage: '#f59e0b',
  Wildlife: '#16a34a',
  Adventure: '#ef4444',
  Pilgrimage: '#8b5cf6',
  Nature: '#22c55e',
  City: '#334155',
}

const SEASON_SPOTLIGHTS = [
  {
    title: 'Summer Escapes',
    icon: '☀️',
    text: 'Cool hills, tea valleys, and mountain air for warm-month travel.',
    color: '#f97316',
    route: '/india',
  },
  {
    title: 'Monsoon Moods',
    icon: '🌧️',
    text: 'Waterfalls, misty forests, and lush green landscapes across India.',
    color: '#0f766e',
    route: '/india',
  },
  {
    title: 'Winter Icons',
    icon: '❄️',
    text: 'Palaces, desert sunsets, heritage cities, and festival-season trips.',
    color: '#2563eb',
    route: '/india',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const [trips, setTrips] = useState([])
  const [bookings, setBookings] = useState([])
  const [indiaDestinations, setIndiaDestinations] = useState([])

  useEffect(() => {
    fetch(`${API}/trips`, { headers: { authorization: token } })
      .then((r) => r.json())
      .then((d) => setTrips(d.trips || []))
      .catch(() => {})

    fetch(`${API}/bookings`, { headers: { authorization: token } })
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})

    fetch(`${API}/india-destinations`)
      .then((r) => r.json())
      .then((d) => setIndiaDestinations(d.destinations || []))
      .catch(() => {})
  }, [token])

  const paid = bookings.filter((b) => b.paymentStatus === 'paid').length
  const upcomingTrip = trips.find((trip) => trip.startDate)
  const featuredDestinations = indiaDestinations.slice(0, 4)

  const allFeatures = [
    { icon: '🏨', label: 'Browse Hotels', desc: 'Search and filter hotels', path: '/hotels', color: '#9b59b6' },
    { icon: '📋', label: 'Trip Planner', desc: 'Plan step-by-step', path: '/planner', color: '#2980b9' },
    { icon: '🧳', label: 'My Trips', desc: 'View and manage trips', path: '/trips', color: '#27ae60' },
    { icon: '📖', label: 'My Bookings', desc: 'All hotel bookings', path: '/bookings', color: '#e67e22' },
    { icon: '🗺️', label: 'Destination Map', desc: 'Interactive world map', path: '/map', color: '#16a085' },
    { icon: '🌤️', label: 'Weather Forecast', desc: 'Live weather anywhere', path: '/weather', color: '#3498db' },
    { icon: '💰', label: 'Budget Calculator', desc: 'Plan your expenses', path: '/budget', color: '#e74c3c' },
    { icon: '📅', label: 'Itinerary Builder', desc: 'Day-by-day schedule', path: '/itinerary', color: '#2c3e50' },
    { icon: '⭐', label: 'Hotel Reviews', desc: 'Read and write reviews', path: '/reviews', color: '#f39c12' },
    { icon: '🌍', label: 'Travel Wishlist', desc: 'Your bucket list', path: '/wishlist', color: '#1abc9c' },
    ...(user.role === 'admin' ? [{ icon: '⚙️', label: 'Admin Panel', desc: 'Manage everything', path: '/admin', color: '#e67e22' }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2980b9)', color: '#fff', borderRadius: '18px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '120px', opacity: 0.07 }}>✈️</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: '700' }}>
            Welcome back, {user.name?.split(' ')[0] || 'Traveler'}
          </h1>
          <p style={{ margin: '0 0 22px', opacity: 0.85, fontSize: '14px' }}>
            {trips.length > 0
              ? `You have ${trips.length} trip${trips.length !== 1 ? 's' : ''} planned. Keep exploring!`
              : 'Ready to plan your next adventure? Start below!'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: '🏨 Find Hotels', path: '/hotels' },
              { label: '📋 Plan a Trip', path: '/planner' },
              { label: '🌤️ Check Weather', path: '/weather' },
              { label: '🌍 My Wishlist', path: '/wishlist' },
            ].map((button) => (
              <button
                key={button.path}
                onClick={() => navigate(button.path)}
                style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', backdropFilter: 'blur(4px)' }}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Trips Planned', value: trips.length, color: '#3498db', icon: '🧳' },
            { label: 'Hotel Bookings', value: bookings.length, color: '#9b59b6', icon: '🏨' },
            { label: 'Paid Bookings', value: paid, color: '#27ae60', icon: '✅' },
            { label: 'All India Travel Places', value: indiaDestinations.length, color: '#e67e22', icon: '🇮🇳' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: '#fff', borderRadius: '12px', padding: '18px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>Explore India</h3>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Popular places you can jump into right now</p>
              </div>
              <button onClick={() => navigate('/india')} style={{ background: 'none', border: 'none', color: '#2980b9', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                View all
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
              {featuredDestinations.map((dest) => (
                <div
                  key={dest._id}
                  onClick={() => navigate(`/india/${dest._id}`)}
                  style={{ border: '1px solid #eef2f7', borderRadius: '14px', padding: '16px', cursor: 'pointer', background: '#fbfdff' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e3a5f' }}>{dest.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{dest.state}</div>
                    </div>
                    <span style={{ background: '#fff7ed', color: '#d97706', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '10px' }}>
                      {dest.rating}/5
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.5', margin: '0 0 10px' }}>
                    {dest.description?.slice(0, 82)}...
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: `${CAT_COLORS[dest.category] || '#64748b'}22`, color: CAT_COLORS[dest.category] || '#64748b', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '10px' }}>
                      {dest.category}
                    </span>
                    <span style={{ color: '#27ae60', fontWeight: '700', fontSize: '12px' }}>
                      Rs {dest.avgBudgetPerDay?.toLocaleString()}/day
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 10px' }}>Travel Snapshot</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fbff' }}>
                  <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Upcoming Trip</div>
                  <div style={{ color: '#1e3a5f', fontSize: '15px', fontWeight: '700', marginTop: '4px' }}>
                    {upcomingTrip?.tripName || 'No trip planned yet'}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '3px' }}>
                    {upcomingTrip ? `${upcomingTrip.destination} • ${upcomingTrip.startDate || 'Date pending'}` : 'Create a plan to see it here.'}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#fcfaf5' }}>
                  <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Booking Status</div>
                  <div style={{ color: '#1e3a5f', fontSize: '15px', fontWeight: '700', marginTop: '4px' }}>
                    {paid} paid of {bookings.length} total
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '3px' }}>
                    Keep an eye on pending payments before your next trip.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #fde7c7' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 8px' }}>Ready for the next move?</h3>
              <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.5', margin: '0 0 14px' }}>
                Build a trip first, then match it with hotels, weather, and budget in a couple of taps.
              </p>
              <button onClick={() => navigate('/planner')} style={{ padding: '10px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                Open Planner
              </button>
            </div>
          </div>
        </div>

        {trips.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>Recent Trips</h3>
              <button onClick={() => navigate('/trips')} style={{ background: 'none', border: 'none', color: '#2980b9', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                See all
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
              {trips.slice(0, 4).map((trip) => (
                <div key={trip._id} onClick={() => navigate('/trips')} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>Trip</div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>{trip.tripName}</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{trip.destination}</div>
                  {trip.startDate && <div style={{ color: '#aaa', fontSize: '11px', marginTop: '4px' }}>{trip.startDate}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>Recent Bookings</h3>
              <button onClick={() => navigate('/bookings')} style={{ background: 'none', border: 'none', color: '#2980b9', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                See all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bookings.slice(0, 2).map((booking) => (
                <div key={booking._id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{booking.hotelName}</div>
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                      {booking.checkIn} to {booking.checkOut} • {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#1e3a5f' }}>Rs {booking.totalPrice?.toLocaleString()}</div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: booking.paymentStatus === 'paid' ? '#eafaf1' : '#fff8e1', color: booking.paymentStatus === 'paid' ? '#27ae60' : '#e67e22' }}>
                      {booking.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>Travel Inspiration</h3>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>A few fresh ideas when you want the next trip to feel special</p>
            </div>
            <button onClick={() => navigate('/wishlist')} style={{ background: 'none', border: 'none', color: '#2980b9', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
              Save ideas
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg,#fff8ec,#fff,#eef7ff)', borderRadius: '18px', padding: '22px', boxShadow: '0 8px 24px rgba(30,58,95,0.08)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ color: '#f97316', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Editor Pick</div>
                  <h4 style={{ margin: 0, fontSize: '22px', lineHeight: '1.2', color: '#1e3a5f' }}>
                    {featuredDestinations[0]?.name || 'Find your next India escape'}
                  </h4>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: '1.6', maxWidth: '520px' }}>
                    {featuredDestinations[0]?.description?.slice(0, 140) || 'Explore places with strong culture, memorable views, and the kind of details that make a trip stick with you.'}
                  </p>
                </div>
                <div style={{ minWidth: '74px', height: '74px', borderRadius: '18px', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.15)' }}>
                  {featuredDestinations[0]?.category === 'Beach' ? '🏖️' :
                   featuredDestinations[0]?.category === 'Mountain' ? '🏔️' :
                   featuredDestinations[0]?.category === 'Heritage' ? '🏰' :
                   featuredDestinations[0]?.category === 'Wildlife' ? '🐅' :
                   featuredDestinations[0]?.category === 'Adventure' ? '🧗' :
                   featuredDestinations[0]?.category === 'Pilgrimage' ? '🛕' :
                   featuredDestinations[0]?.category === 'Nature' ? '🌿' : '🌆'}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <span style={{ padding: '7px 12px', borderRadius: '999px', background: '#fff', color: '#1e3a5f', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  📍 {featuredDestinations[0]?.state || 'India'}
                </span>
                <span style={{ padding: '7px 12px', borderRadius: '999px', background: '#fff', color: '#1e3a5f', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  ⭐ {featuredDestinations[0]?.rating || '4.5'}
                </span>
                <span style={{ padding: '7px 12px', borderRadius: '999px', background: '#fff', color: '#1e3a5f', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  💸 Rs {featuredDestinations[0]?.avgBudgetPerDay?.toLocaleString() || '2000'}/day
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(featuredDestinations[0]?`/india/${featuredDestinations[0]._id}`:'/india')} style={{ padding: '10px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                  Explore Place
                </button>
                <button onClick={() => navigate('/wishlist')} style={{ padding: '10px 16px', background: '#fff', color: '#1e3a5f', border: '1px solid #dbe4ef', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                  Add to Wishlist
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {SEASON_SPOTLIGHTS.map((spot) => (
                <div key={spot.title} onClick={() => navigate(spot.route)} style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', borderLeft: `4px solid ${spot.color}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${spot.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                      {spot.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e3a5f', marginBottom: '4px' }}>{spot.title}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>{spot.text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 14px' }}>All Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '12px' }}>
          {allFeatures.map((feature) => (
            <div
              key={feature.path}
              onClick={() => navigate(feature.path)}
              style={{ background: '#fff', borderRadius: '12px', padding: '18px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: `3px solid ${feature.color}`, transition: 'transform 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>{feature.icon}</div>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3a5f', marginBottom: '4px' }}>{feature.label}</div>
              <div style={{ color: '#aaa', fontSize: '11px' }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
