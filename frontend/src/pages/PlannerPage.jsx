// PlannerPage.jsx - Step-by-step trip planner

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

// All 4 steps
const STEPS = ['Destination', 'Dates & Travelers', 'Activities', 'Review & Save']

const ALL_ACTIVITIES = [
  '🏖️ Beach', '🏔️ Hiking', '🍜 Food & Dining', '🏛️ Museums',
  '🛍️ Shopping', '🎭 Nightlife', '📸 Photography', '🌿 Nature',
  '⛷️ Adventure Sports', '💆 Spa & Wellness', '🚗 Road Trip', '🎨 Art & Culture',
]

export default function PlannerPage() {
  const navigate  = useNavigate()
  const token     = localStorage.getItem('token')

  // Current step (0 to 3)
  const [step, setStep] = useState(0)

  // All form data stored here
  const [form, setForm] = useState({
    tripName:    '',
    destination: '',
    startDate:   '',
    endDate:     '',
    travelers:   1,
    budget:      '',
    activities:  [],
    notes:       '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  // Update a single field
  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Toggle activity selection
  function toggleActivity(act) {
    setForm(prev => {
      const already = prev.activities.includes(act)
      return {
        ...prev,
        activities: already
          ? prev.activities.filter(a => a !== act)
          : [...prev.activities, act],
      }
    })
  }

  // Go to next step
  function nextStep() {
    setError('')

    if (step === 0 && (!form.tripName || !form.destination)) {
      setError('Please fill in trip name and destination')
      return
    }
    if (step === 1 && (!form.startDate || !form.endDate)) {
      setError('Please select start and end date')
      return
    }

    setStep(s => s + 1)
  }

  // Save trip to backend
  async function saveTrip() {
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API}/trips`, form, {
        headers: { authorization: token },
      })
      setSuccess(true)
      setTimeout(() => navigate('/trips'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <Navbar />

      <div style={contentStyle}>
        <h2 style={titleStyle}>📋 Plan Your Trip</h2>

        {/* Step indicator */}
        <div style={stepBarStyle}>
          {STEPS.map((s, i) => (
            <div key={i} style={stepItemStyle}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: i < step ? '#2ecc71' : i === step ? '#1e3a5f' : '#ddd',
                color: i <= step ? '#fff' : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px', flexShrink: 0,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '12px', color: i === step ? '#1e3a5f' : '#999', fontWeight: i === step ? '600' : '400', marginTop: '4px', textAlign: 'center' }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', top: '17px', left: '60%', width: 'calc(100% - 30px)', height: '2px', background: i < step ? '#2ecc71' : '#ddd' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={cardStyle}>
          {error   && <div style={errorStyle}>{error}</div>}
          {success && <div style={successStyle}>✅ Trip saved! Redirecting to your trips...</div>}

          {/* STEP 0 - Destination */}
          {step === 0 && (
            <div>
              <h3 style={stepTitle}>Where are you going?</h3>

              <Field label="Trip Name">
                <input
                  style={inputStyle}
                  placeholder="e.g. Ooty Summer 2026"
                  value={form.tripName}
                  onChange={e => update('tripName', e.target.value)}
                />
              </Field>

              <Field label="Destination">
                <input
                  style={inputStyle}
                  placeholder="e.g. Ooty, India"
                  value={form.destination}
                  onChange={e => update('destination', e.target.value)}
                />
              </Field>

              <Field label="Budget (optional)">
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.budget}
                  onChange={e => update('budget', e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* STEP 1 - Dates */}
          {step === 1 && (
            <div>
              <h3 style={stepTitle}>When are you going?</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Start Date">
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.startDate}
                    onChange={e => update('startDate', e.target.value)}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.endDate}
                    onChange={e => update('endDate', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Number of Travelers">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button style={counterBtn} onClick={() => update('travelers', Math.max(1, form.travelers - 1))}>−</button>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e3a5f' }}>{form.travelers}</span>
                  <button style={counterBtn} onClick={() => update('travelers', form.travelers + 1)}>+</button>
                </div>
              </Field>
            </div>
          )}

          {/* STEP 2 - Activities */}
          {step === 2 && (
            <div>
              <h3 style={stepTitle}>What do you want to do?</h3>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
                Select all activities that interest you
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {ALL_ACTIVITIES.map(act => (
                  <div
                    key={act}
                    onClick={() => toggleActivity(act)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: form.activities.includes(act) ? '2px solid #2980b9' : '1.5px solid #ddd',
                      background: form.activities.includes(act) ? '#ebf5fb' : '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: form.activities.includes(act) ? '600' : '400',
                      color: form.activities.includes(act) ? '#1e3a5f' : '#555',
                      textAlign: 'center',
                    }}
                  >
                    {act}
                  </div>
                ))}
              </div>

              <Field label="Notes (optional)" style={{ marginTop: '20px' }}>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Any special requirements or notes..."
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* STEP 3 - Review */}
          {step === 3 && (
            <div>
              <h3 style={stepTitle}>Review Your Trip</h3>

              <div style={{ background: '#f0f8ff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <Row label="Trip Name"    value={form.tripName} />
                <Row label="Destination"  value={form.destination} />
                <Row label="Dates"        value={`${form.startDate} → ${form.endDate}`} />
                <Row label="Travelers"    value={form.travelers} />
                {form.budget && <Row label="Budget" value={`₹${Number(form.budget).toLocaleString()}`} />}
                {form.activities.length > 0 && (
                  <Row label="Activities" value={form.activities.join(', ')} />
                )}
                {form.notes && <Row label="Notes" value={form.notes} />}
              </div>

              <button style={saveBtnStyle} onClick={saveTrip} disabled={loading}>
                {loading ? 'Saving...' : '✅ Save Trip'}
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {!success && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button
                style={backBtnStyle}
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
              >
                ← Back
              </button>

              {step < 3 && (
                <button style={nextBtnStyle} onClick={nextStep}>
                  Next →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper components
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#444' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dce6f0', fontSize: '14px' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: '600', color: '#1e3a5f', maxWidth: '60%', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ----- Styles -----
const pageStyle    = { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Poppins, sans-serif' }
const contentStyle = { maxWidth: '700px', margin: '0 auto', padding: '30px 20px' }
const titleStyle   = { fontSize: '22px', fontWeight: '700', color: '#1e3a5f', marginBottom: '24px' }
const stepTitle    = { fontSize: '18px', fontWeight: '600', color: '#1e3a5f', marginBottom: '20px' }

const stepBarStyle = {
  display: 'grid',
  gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
  marginBottom: '30px',
  position: 'relative',
}
const stepItemStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
}

const cardStyle    = { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
const inputStyle   = { width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }
const counterBtn   = { width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid #ddd', background: '#fff', fontSize: '20px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }
const backBtnStyle = { padding: '10px 24px', background: '#fff', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '500' }
const nextBtnStyle = { padding: '10px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '600' }
const saveBtnStyle = { width: '100%', padding: '14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '700' }
const errorStyle   = { background: '#ffeaea', border: '1px solid #f5c6c6', color: '#c0392b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }
const successStyle = { background: '#eafaf1', border: '1px solid #a9dfbf', color: '#1e8449', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', fontWeight: '500' }
