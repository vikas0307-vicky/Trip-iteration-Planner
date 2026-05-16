import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [booking, setBooking] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [receiptResult, setReceiptResult] = useState(null)

  useEffect(() => {
    fetch(`${API}/bookings`, { headers: { authorization: token } })
      .then((r) => r.json())
      .then((data) => {
        const found = data.bookings?.find((b) => b._id === id)
        if (found) setBooking(found)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [id, token])

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loadRazorpayCheckout()

      const orderRes = await fetch(`${API}/payment/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: token },
        body: JSON.stringify({ bookingId: id }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.message || 'Unable to create Razorpay order')

      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TravelApp',
        description: booking.bookingType === 'transport'
          ? `${booking.transportMode}: ${booking.source} to ${booking.destination}`
          : booking.hotelName,
        order_id: orderData.orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: { color: '#1e3a5f' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/payment/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', authorization: token },
              body: JSON.stringify({ bookingId: id, ...response }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed')
            if (verifyData.booking) setBooking(verifyData.booking)
            setReceiptResult(verifyData)
            setDone(true)
          } catch (err) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      })

      razorpay.on('payment.failed', (response) => {
        setError(response.error?.description || 'Payment failed')
        setLoading(false)
      })

      razorpay.open()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (notFound) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '50px' }}>X</div>
        <h2 style={{ color: '#1e3a5f', marginTop: '16px' }}>Booking not found</h2>
        <button onClick={() => navigate('/bookings')} style={{ marginTop: '20px', padding: '12px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: '600' }}>
          View My Bookings
        </button>
      </div>
    </div>
  )

  if (!booking) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '15px' }}>
        Loading booking details...
      </div>
    </div>
  )

  if (booking.paymentStatus === 'paid' && !done) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '60px' }}>OK</div>
          <h2 style={{ color: '#1e8449', margin: '16px 0 8px' }}>Already Paid!</h2>
          <p style={{ color: '#555', marginBottom: '24px' }}>This booking has already been paid for.</p>
          <button onClick={() => navigate('/bookings')} style={{ padding: '12px 28px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: '600' }}>
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '64px' }}>OK</div>
          <h2 style={{ color: '#1e8449', margin: '16px 0 8px', fontSize: '24px' }}>Payment Successful!</h2>
          <p style={{ color: '#555', marginBottom: '8px', fontSize: '15px' }}>
            <strong>{booking.bookingType === 'transport' ? `${booking.transportMode} ${booking.source} to ${booking.destination}` : booking.hotelName}</strong> is booked.
          </p>
          <p style={{ color: '#888', marginBottom: '28px', fontSize: '14px' }}>
            {booking.bookingType === 'transport' ? booking.travelDate : `${booking.checkIn} to ${booking.checkOut}`} - {booking.bookingType === 'transport' ? booking.passengers : booking.guests} {booking.bookingType === 'transport' ? 'passenger' : 'guest'}{(booking.bookingType === 'transport' ? booking.passengers : booking.guests) !== 1 ? 's' : ''}
          </p>
          {receiptResult?.qrCodeDataUrl && (
            <div style={{ background: '#fff', border: '1px solid #d8efe0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <img src={receiptResult.qrCodeDataUrl} alt="Receipt QR code" style={{ width: '160px', height: '160px' }} />
              <p style={{ margin: '8px 0 0', color: '#555', fontSize: '13px', fontWeight: '700' }}>Scan QR to view your e-bill</p>
            </div>
          )}
          {receiptResult?.emailStatus && (
            <p style={{ color: receiptResult.emailStatus === 'sent' ? '#1e8449' : '#9a6a00', margin: '0 0 16px', fontSize: '13px' }}>
              Receipt email: {receiptResult.emailStatus}
            </p>
          )}
          {receiptResult?.receiptUrl && (
            <button onClick={() => window.open(receiptResult.receiptUrl, '_blank', 'noopener,noreferrer')} style={{ padding: '12px 22px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '12px', width: '100%' }}>
              View E-Bill
            </button>
          )}
          {receiptResult?.receiptUrl && (
            <button onClick={() => window.open(receiptResult.receiptUrl?.replace('/receipt/', '/receipts/') + '/pdf', '_blank', 'noopener,noreferrer')} style={{ padding: '12px 22px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '12px', width: '100%' }}>
              Download PDF
            </button>
          )}
          <button onClick={() => navigate('/bookings')} style={{ padding: '14px 32px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: '700' }}>
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  )

  const summaryRows = [
    [booking.bookingType === 'transport' ? 'Trip' : 'Hotel', booking.bookingType === 'transport' ? `${booking.transportMode}: ${booking.source} to ${booking.destination}` : booking.hotelName],
    [booking.bookingType === 'transport' ? 'Travel Date' : 'Check-in', booking.bookingType === 'transport' ? booking.travelDate : booking.checkIn],
    [booking.bookingType === 'transport' ? 'Operator' : 'Check-out', booking.bookingType === 'transport' ? booking.provider : booking.checkOut],
    ...(booking.bookingType === 'transport' ? [] : [['Room', booking.roomType ? `${booking.roomType}${booking.roomsBooked ? ` x ${booking.roomsBooked}` : ''}` : 'Classic Room']]),
    [booking.bookingType === 'transport' ? 'Class' : 'Nights', booking.bookingType === 'transport' ? booking.seatClass : booking.nights],
    ...(booking.bookingType === 'transport' ? [['Seat', booking.seatType ? `${booking.seatType} (${booking.seatNumber || 'auto'})` : 'Auto assigned']] : []),
    [booking.bookingType === 'transport' ? 'Passengers' : 'Guests', booking.bookingType === 'transport' ? booking.passengers : booking.guests],
  ]

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '30px 20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f', marginBottom: '24px' }}>Complete Payment</h2>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 14px', color: '#1e3a5f', fontSize: '16px' }}>Booking Summary</h3>
          {summaryRows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' }}>
              <span style={{ color: '#888' }}>{label}</span>
              <span style={{ fontWeight: '600', color: '#333', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
            <span>Total Amount</span>
            <span>Rs {booking.totalPrice?.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2980b9)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '10px', letterSpacing: '1px' }}>RAZORPAY SECURE CHECKOUT</div>
            <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Pay Rs {booking.totalPrice?.toLocaleString()}</div>
            <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.6 }}>
              Complete your payment using UPI, card, net banking, wallet, or other Razorpay test payment methods.
            </div>
          </div>

          {error && (
            <div style={{ background: '#ffeaea', border: '1px solid #f5c6c6', color: '#c0392b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handlePay}>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '10px', background: loading ? '#aaa' : 'linear-gradient(135deg, #27ae60, #2ecc71)', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              {loading ? 'Opening Razorpay...' : `Pay Rs ${booking.totalPrice?.toLocaleString()} with Razorpay`}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', opacity: 0.5, fontSize: '12px', color: '#888', flexWrap: 'wrap' }}>
            <span>Secure checkout</span>
            <span>UPI and cards</span>
            <span>Verified payment</span>
          </div>
        </div>
      </div>
    </div>
  )
}
