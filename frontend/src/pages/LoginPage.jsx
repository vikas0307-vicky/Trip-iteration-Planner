// LoginPage.jsx - Fixed version
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const navigate        = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [serverStatus, setServerStatus] = useState('')

  // Test if backend is reachable
  async function testBackend() {
    setServerStatus('checking...')
    try {
      const res = await fetch('http://localhost:5000/api/health', { method: 'GET' })
      if (res.ok) {
        setServerStatus('✅ Backend is running!')
      } else {
        setServerStatus('⚠️ Backend responded with error')
      }
    } catch {
      setServerStatus('❌ Backend is NOT reachable. Run: npm run dev in backend folder')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      })

      let data
      try { data = await res.json() }
      catch { throw new Error('Server returned invalid response. Is backend running?') }

      if (!res.ok) throw new Error(data.message || 'Login failed')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('❌ Cannot connect to server.\n\nPlease make sure:\n1. Backend is running (npm run dev in backend folder)\n2. MongoDB is running (net start MongoDB)\n3. Both are running on port 5000')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2980b9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '50px' }}>✈️</div>
          <h1 style={{ color: '#1e3a5f', fontSize: '26px', fontWeight: '700', margin: '8px 0 4px' }}>
            TravelApp
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            Sign in to plan your trips
          </p>
        </div>

        {/* Server status checker */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <button onClick={testBackend} style={{
            background: 'none', border: '1px dashed #ddd', borderRadius: '8px',
            padding: '6px 16px', fontSize: '12px', color: '#888', cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}>
            🔍 Test server connection
          </button>
          {serverStatus && (
            <p style={{ fontSize: '12px', marginTop: '6px', color: serverStatus.startsWith('✅') ? '#27ae60' : '#e74c3c', fontWeight: '600' }}>
              {serverStatus}
            </p>
          )}
        </div>

        {/* Error box */}
        {error && (
          <div style={{
            background: '#ffeaea', border: '1px solid #f5c6c6',
            color: '#c0392b', padding: '12px 16px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '20px', whiteSpace: 'pre-line',
            lineHeight: '1.7',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '13px 14px', borderRadius: '10px',
                border: '1.5px solid #ddd', fontSize: '14px', outline: 'none',
                fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '13px 14px', borderRadius: '10px',
                border: '1.5px solid #ddd', fontSize: '14px', outline: 'none',
                fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: loading ? '#aaa' : 'linear-gradient(135deg, #1e3a5f, #2980b9)',
              color: '#fff', fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#2980b9', fontWeight: '700', textDecoration: 'none' }}>
            Create one here →
          </Link>
        </p>

        
      </div>
    </div>
  )
}
