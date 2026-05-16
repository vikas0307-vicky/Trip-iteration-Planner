import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function BookingsPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`${API}/bookings`, { headers: { authorization: token } })
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  async function cancelBooking() {
    setCancelling(true)
    try {
      const res = await fetch(`${API}/bookings/${cancelId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: token },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === cancelId
            ? { ...booking, status: 'cancelled', paymentStatus: 'refund_pending' }
            : booking,
        ),
      )
      showToast('Booking cancelled. Refund notification sent.')
      setCancelId(null)
      setReason('')
    } catch (err) {
      showToast(err.message)
    } finally {
      setCancelling(false)
    }
  }

  async function deleteBooking() {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/bookings/${deleteId}`, {
        method: 'DELETE',
        headers: { authorization: token },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setBookings((prev) => prev.filter((booking) => booking._id !== deleteId))
      showToast('Booking deleted successfully.')
      setDeleteId(null)
    } catch (err) {
      showToast(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const statusColor = {
    paid: '#27ae60',
    pending: '#e67e22',
    refund_pending: '#9b59b6',
    failed: '#e74c3c',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Poppins,sans-serif' }}>
      <Navbar />

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            background: '#eaf2ff',
            color: '#1e3a5f',
            border: '1px solid #cfe0ff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast}
        </div>
      )}

      {cancelId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: '#e74c3c', margin: '0 0 8px', fontSize: '18px' }}>Cancel Booking</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Are you sure? You will receive a refund notification. This cannot be undone.
            </p>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>
              Reason for cancellation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Poppins,sans-serif', boxSizing: 'border-box', marginBottom: '16px' }}
            >
              <option value="">Select a reason...</option>
              <option>Change of plans</option>
              <option>Found a better option</option>
              <option>Medical emergency</option>
              <option>Work commitment</option>
              <option>Travel restrictions</option>
              <option>Other</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setCancelId(null)
                  setReason('')
                }}
                style={{ flex: 1, padding: '12px', background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}
              >
                Keep Booking
              </button>
              <button
                onClick={cancelBooking}
                disabled={cancelling || !reason}
                style={{ flex: 1, padding: '12px', background: cancelling || !reason ? '#aaa' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: cancelling || !reason ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'Poppins,sans-serif' }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: '#e74c3c', margin: '0 0 8px', fontSize: '18px' }}>Delete Booking</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '18px' }}>
              This will permanently remove the booking from your list. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: '12px', background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}
              >
                Keep Booking
              </button>
              <button
                onClick={deleteBooking}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', background: deleting ? '#aaa' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'Poppins,sans-serif' }}
              >
                {deleting ? 'Deleting...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>My Bookings ({bookings.length})</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Manage hotel and travel bookings</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/transport')} style={{ padding: '10px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>+ Travel</button>
            <button onClick={() => navigate('/hotels')} style={{ padding: '10px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>+ Hotel</button>
          </div>
        </div>

        {loading && <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading bookings...</p>}

        {!loading && bookings.length === 0 && (
          <div style={{ background: 'linear-gradient(135deg,#ffffff,#f7fbff)', borderRadius: '22px', padding: '56px 32px', textAlign: 'center', boxShadow: '0 12px 32px rgba(30,58,95,0.08)', border: '1px solid #e7eef7', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-18px', right: '-10px', fontSize: '90px', opacity: 0.05 }}>🧳</div>
            <div style={{ width: '92px', height: '92px', margin: '0 auto 18px', borderRadius: '28px', background: 'linear-gradient(135deg,#1e3a5f,#2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 28px rgba(41,128,185,0.22)' }}>
              <div style={{ fontSize: '44px' }}>🏨</div>
            </div>
            <p style={{ fontWeight: '700', color: '#1e3a5f', margin: '0 0 10px', fontSize: '24px' }}>No bookings yet</p>
            <p style={{ color: '#64748b', margin: '0 auto 22px', fontSize: '15px', maxWidth: '420px', lineHeight: '1.6' }}>
              Start with a hotel stay or a travel booking and your upcoming plans will show up here beautifully.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/transport')} style={{ padding: '12px 22px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: '14px', boxShadow: '0 10px 24px rgba(30,58,95,0.18)' }}>
                ✈️ Book Travel
              </button>
              <button onClick={() => navigate('/hotels')} style={{ padding: '12px 22px', background: '#fff', color: '#1e3a5f', border: '1px solid #d7e3f0', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: '14px' }}>
                🏨 Browse Hotels
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                background: booking.status === 'cancelled' ? '#fafafa' : '#fff',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: booking.status === 'cancelled' ? '2px solid #f5c6c6' : '2px solid transparent',
                opacity: booking.status === 'cancelled' ? 0.8 : 1,
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '36px' }}>
                  {booking.bookingType === 'transport'
                    ? booking.transportMode === 'Flight'
                      ? 'Flight'
                      : booking.transportMode === 'Train'
                        ? 'Train'
                        : 'Bus'
                    : 'Hotel'}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '17px', color: '#1e3a5f', textDecoration: booking.status === 'cancelled' ? 'line-through' : '' }}>
                        {booking.bookingType === 'transport'
                          ? `${booking.transportMode}: ${booking.source} to ${booking.destination}`
                          : booking.hotelName}
                      </h3>
                      <p style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}>
                        {booking.bookingType === 'transport'
                          ? `${booking.travelDate} . ${booking.provider}`
                          : `${booking.checkIn} to ${booking.checkOut}`}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}>
                        {booking.bookingType === 'transport'
                          ? `${booking.passengers} passenger${booking.passengers !== 1 ? 's' : ''} . ${booking.seatClass} . ${booking.seatType || 'Auto assigned'}${booking.seatNumber ? ` (${booking.seatNumber})` : ''}`
                          : `${booking.guests} guest${booking.guests !== 1 ? 's' : ''} . ${booking.nights} night${booking.nights !== 1 ? 's' : ''} . ${booking.roomType || 'Classic Room'}${booking.roomsBooked ? ` x ${booking.roomsBooked}` : ''}`}
                      </p>
                      {booking.status === 'cancelled' && (
                        <p style={{ color: '#e74c3c', fontSize: '12px', margin: '4px 0 0', fontWeight: '600' }}>
                          Cancelled . Refund pending (5-7 days)
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f' }}>Rs {booking.totalPrice?.toLocaleString()}</div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: (statusColor[booking.paymentStatus] || '#888') + '22',
                          color: statusColor[booking.paymentStatus] || '#888',
                        }}
                      >
                        {booking.paymentStatus?.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                    {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                      <button onClick={() => navigate(`/payment/${booking._id}`)} style={{ padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                        Pay Now
                      </button>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button onClick={() => setCancelId(booking._id)} style={{ padding: '8px 16px', background: '#ffeaea', color: '#e74c3c', border: '1px solid #f5c6c6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                        Cancel Booking
                      </button>
                    )}
                    <button onClick={() => setDeleteId(booking._id)} style={{ padding: '8px 16px', background: '#fff5f5', color: '#c0392b', border: '1px solid #f1b0b7', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'Poppins,sans-serif' }}>
                      Delete
                    </button>
                    <button onClick={() => navigate('/notifications')} style={{ padding: '8px 16px', background: '#f8f9fa', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>
                      View Notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
