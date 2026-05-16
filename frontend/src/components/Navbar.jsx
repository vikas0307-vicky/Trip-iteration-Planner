import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api'

export default function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const token = localStorage.getItem('token')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!token) return

    fetch(`${API}/me`, { headers: { authorization: token } })
      .then((r) => {
        if (!r.ok) throw new Error('Not logged in')
        return r.json()
      })
      .then((d) => {
        if (d.user) {
          localStorage.setItem('user', JSON.stringify(d.user))
          setUser(d.user)
        }
      })
      .catch(() => {})

    fetch(`${API}/notifications`, { headers: { authorization: token } })
      .then((r) => r.json())
      .then((d) => setUnread(d.unreadCount || 0))
      .catch(() => {})

    const interval = setInterval(() => {
      fetch(`${API}/notifications`, { headers: { authorization: token } })
        .then((r) => r.json())
        .then((d) => setUnread(d.unreadCount || 0))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [token])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const mainLinks = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/india', label: 'India', icon: '🇮🇳' },
    { to: '/hotels', label: 'Hotels', icon: '🏨' },
    { to: '/transport', label: 'Travel', icon: '🎫' },
    { to: '/bookings', label: 'Bookings', icon: '📖' },
    { to: '/planner', label: 'Planner', icon: '📋' },
    { to: '/chatbot', label: 'AI Chat', icon: '🤖' },
  ]

  return (
    <nav
      style={{
        background: '#1e3a5f',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        fontFamily: 'Poppins,sans-serif',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Link to="/" style={{ color: '#fff', fontSize: '17px', fontWeight: '700', textDecoration: 'none', flexShrink: 0 }}>
        ✈️ TravelApp
      </Link>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', overflowX: 'auto', flex: 1, justifyContent: 'flex-end' }}>
        {mainLinks.map((link) => (
          <Link key={link.to} to={link.to} style={{ color: '#cce4f7', textDecoration: 'none', padding: '6px 9px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
            {link.icon} {link.label}
          </Link>
        ))}

        {user.role === 'admin' && (
          <Link to="/admin" style={{ color: '#f9ca24', textDecoration: 'none', padding: '6px 9px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
            ⚙️ Admin
          </Link>
        )}

        <Link to="/notifications" style={{ position: 'relative', color: '#cce4f7', textDecoration: 'none', padding: '6px 9px', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          🔔
          {unread > 0 && (
            <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#e74c3c', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <span style={{ color: '#aaa', fontSize: '11px', whiteSpace: 'nowrap' }}>👤 {user.name?.split(' ')[0] || 'User'}</span>
        <button onClick={logout} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'Poppins,sans-serif', marginLeft: '4px' }}>
          Logout
        </button>
      </div>
    </nav>
  )
}
