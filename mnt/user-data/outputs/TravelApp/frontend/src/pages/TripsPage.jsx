// TripsPage.jsx - Shows all your saved trips

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function TripsPage() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  // Load trips from backend
  useEffect(() => {
    axios
      .get(`${API}/trips`, { headers: { authorization: token } })
      .then(res => setTrips(res.data.trips))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Delete a trip
  async function deleteTrip(id) {
    if (!window.confirm('Are you sure you want to delete this trip?')) return

    try {
      await axios.delete(`${API}/trips/${id}`, {
        headers: { authorization: token },
      })
      // Remove it from the list without reloading
      setTrips(prev => prev.filter(t => t._id !== id))
    } catch {
      alert('Failed to delete trip')
    }
  }

  return (
    <div style={pageStyle}>
      <Navbar />

      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={titleStyle}>🧳 My Trips ({trips.length})</h2>
          <button style={addBtnStyle} onClick={() => navigate('/planner')}>
            + Plan New Trip
          </button>
        </div>

        {loading && <p style={{ color: '#888' }}>Loading your trips...</p>}

        {!loading && trips.length === 0 && (
          <div style={emptyStyle}>
            <p style={{ fontSize: '50px' }}>✈️</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#444' }}>No trips yet!</p>
            <p style={{ color: '#888', marginBottom: '20px' }}>Start planning your first adventure</p>
            <button style={addBtnStyle} onClick={() => navigate('/planner')}>
              Plan My First Trip
            </button>
          </div>
        )}

        <div style={gridStyle}>
          {trips.map(trip => (
            <TripCard key={trip._id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TripCard({ trip, onDelete }) {
  const nights =
    trip.startDate && trip.endDate
      ? Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
      : null

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2980b9)', borderRadius: '10px', padding: '16px', marginBottom: '16px', color: '#fff' }}>
        <div style={{ fontSize: '28px' }}>🌍</div>
        <div style={{ fontWeight: '700', fontSize: '16px', marginTop: '6px' }}>{trip.tripName}</div>
        <div style={{ opacity: 0.85, fontSize: '13px' }}>{trip.destination}</div>
      </div>

      {/* Info rows */}
      {trip.startDate && (
        <InfoRow icon="📅" text={`${trip.startDate} → ${trip.endDate}`} />
      )}
      {nights !== null && (
        <InfoRow icon="🌙" text={`${nights} night${nights !== 1 ? 's' : ''}`} />
      )}
      <InfoRow icon="👥" text={`${trip.travelers} traveler${trip.travelers !== 1 ? 's' : ''}`} />
      {trip.budget > 0 && (
        <InfoRow icon="💰" text={`Budget: ₹${Number(trip.budget).toLocaleString()}`} />
      )}

      {/* Activities */}
      {trip.activities && trip.activities.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Activities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {trip.activities.slice(0, 4).map(a => (
              <span key={a} style={tagStyle}>{a}</span>
            ))}
            {trip.activities.length > 4 && (
              <span style={tagStyle}>+{trip.activities.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Delete button */}
      <button style={deleteBtnStyle} onClick={() => onDelete(trip._id)}>
        🗑️ Delete Trip
      </button>
    </div>
  )
}

function InfoRow({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  )
}

// ----- Styles -----
const pageStyle    = { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Poppins, sans-serif' }
const contentStyle = { maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }
const titleStyle   = { fontSize: '22px', fontWeight: '700', color: '#1e3a5f', margin: 0 }
const gridStyle    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

const addBtnStyle = {
  padding: '10px 20px',
  background: '#1e3a5f',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  fontFamily: 'Poppins, sans-serif',
}

const deleteBtnStyle = {
  marginTop: '16px',
  width: '100%',
  padding: '9px',
  background: '#fff',
  color: '#e74c3c',
  border: '1.5px solid #f5c6c6',
  borderRadius: '8px',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'Poppins, sans-serif',
  fontWeight: '500',
}

const tagStyle = {
  background: '#ebf5fb',
  color: '#2980b9',
  borderRadius: '6px',
  padding: '3px 8px',
  fontSize: '11px',
  fontWeight: '500',
}

const emptyStyle = {
  textAlign: 'center',
  background: '#fff',
  borderRadius: '16px',
  padding: '50px 30px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}
