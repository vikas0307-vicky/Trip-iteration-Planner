import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function ReceiptPage() {
  const { paymentId } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/receipts/${paymentId}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Receipt not found')
        setReceipt(data.receipt)
        setQrCodeDataUrl(data.qrCodeDataUrl || '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [paymentId])

  const downloadPdf = () => {
    window.open(`${API}/receipts/${paymentId}/pdf`, '_blank')
  }

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 16px', background: '#fff', borderRadius: '14px', boxShadow: '0 3px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: '#1e3a5f', color: '#fff', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>TravelApp E-Bill</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '13px' }}>{receipt?.receiptNumber || 'Payment receipt'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={downloadPdf} style={{ alignSelf: 'center', padding: '10px 16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '700', fontFamily: 'Poppins, sans-serif' }}>
              Download PDF
            </button>
            <button onClick={() => navigate('/bookings')} style={{ alignSelf: 'center', padding: '10px 16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '700', fontFamily: 'Poppins, sans-serif' }}>
              Back to Bookings
            </button>
          </div>
        </div>

        {loading && <div style={{ padding: '38px', textAlign: 'center', color: '#777' }}>Loading receipt...</div>}
        {error && <div style={{ padding: '38px', textAlign: 'center', color: '#c0392b', fontWeight: '700' }}>{error}</div>}

        {receipt && (
          <div style={{ padding: '26px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px', alignItems: 'start' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', color: '#1e3a5f', fontSize: '20px' }}>{receipt.title}</h2>
              <p style={{ margin: '0 0 18px', color: '#777', fontSize: '13px' }}>
                Paid by {receipt.customer?.name} {receipt.customer?.email ? `(${receipt.customer.email})` : ''}
              </p>

              <div style={{ border: '1px solid #edf1f5', borderRadius: '10px', overflow: 'hidden' }}>
                {receipt.details.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', padding: '12px 14px', borderBottom: '1px solid #edf1f5', fontSize: '14px' }}>
                    <span style={{ color: '#777' }}>{label}</span>
                    <span style={{ color: '#222', fontWeight: '700', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 14px', background: '#f8fafc', color: '#1e3a5f', fontSize: '18px', fontWeight: '800' }}>
                  <span>Total Paid</span>
                  <span>{receipt.amountText}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', color: '#777', fontSize: '13px', lineHeight: 1.7 }}>
                <div>Receipt No: <strong style={{ color: '#333' }}>{receipt.receiptNumber}</strong></div>
                <div>Payment ID: <strong style={{ color: '#333' }}>{receipt.paymentId}</strong></div>
                {receipt.orderId && <div>Order ID: <strong style={{ color: '#333' }}>{receipt.orderId}</strong></div>}
              </div>
            </div>

            <div style={{ textAlign: 'center', border: '1px solid #edf1f5', borderRadius: '10px', padding: '14px' }}>
              {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="Receipt QR code" style={{ width: '160px', height: '160px' }} /> : null}
              <div style={{ marginTop: '8px', color: '#777', fontSize: '12px', fontWeight: '700' }}>Scan to view this e-bill</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
