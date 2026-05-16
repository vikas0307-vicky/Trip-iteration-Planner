import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage            from './pages/LoginPage.jsx'
import RegisterPage         from './pages/RegisterPage.jsx'
import HomePage             from './pages/HomePage.jsx'
import TripsPage            from './pages/TripsPage.jsx'
import PlannerPage          from './pages/PlannerPage.jsx'
import MapPage              from './pages/MapPage.jsx'
import HotelsPage           from './pages/HotelsPage.jsx'
import HotelDetailPage      from './pages/HotelDetailPage.jsx'
import TransportBookingPage from './pages/TransportBookingPage.jsx'
import BookingsPage         from './pages/BookingsPage.jsx'
import PaymentPage          from './pages/PaymentPage.jsx'
import ReceiptPage          from './pages/ReceiptPage.jsx'
import AdminPage            from './pages/AdminPage.jsx'
import WeatherPage          from './pages/WeatherPage.jsx'
import BudgetCalculatorPage from './pages/BudgetCalculatorPage.jsx'
import ItineraryPage        from './pages/ItineraryPage.jsx'
import ReviewsPage          from './pages/ReviewsPage.jsx'
import WishlistPage         from './pages/WishlistPage.jsx'
import ChatbotPage          from './pages/ChatbotPage.jsx'
import IndiaPage            from './pages/IndiaPage.jsx'
import IndiaDetailPage      from './pages/IndiaDetailPage.jsx'
import NotificationsPage    from './pages/NotificationsPage.jsx'

function Private({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}
function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [checking, setChecking] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return

    fetch('http://localhost:5000/api/me', { headers: { authorization: token } })
      .then((r) => {
        if (!r.ok) throw new Error('Not logged in')
        return r.json()
      })
      .then((data) => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          setUser(data.user)
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setChecking(false))
  }, [token])

  if (!token) return <Navigate to="/login" />
  if (checking) return null
  if (user.role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/"              element={<Private><HomePage /></Private>} />
        <Route path="/trips"         element={<Private><TripsPage /></Private>} />
        <Route path="/planner"       element={<Private><PlannerPage /></Private>} />
        <Route path="/map"           element={<Private><MapPage /></Private>} />
        <Route path="/hotels"        element={<Private><HotelsPage /></Private>} />
        <Route path="/hotels/:id"    element={<Private><HotelDetailPage /></Private>} />
        <Route path="/transport"     element={<Private><TransportBookingPage /></Private>} />
        <Route path="/bookings"      element={<Private><BookingsPage /></Private>} />
        <Route path="/payment/:id"   element={<Private><PaymentPage /></Private>} />
        <Route path="/receipt/:paymentId" element={<ReceiptPage />} />
        <Route path="/weather"       element={<Private><WeatherPage /></Private>} />
        <Route path="/budget"        element={<Private><BudgetCalculatorPage /></Private>} />
        <Route path="/itinerary"     element={<Private><ItineraryPage /></Private>} />
        <Route path="/reviews"       element={<Private><ReviewsPage /></Private>} />
        <Route path="/wishlist"      element={<Private><WishlistPage /></Private>} />
        <Route path="/chatbot"       element={<Private><ChatbotPage /></Private>} />
        <Route path="/india"         element={<Private><IndiaPage /></Private>} />
        <Route path="/india/:id"     element={<Private><IndiaDetailPage /></Private>} />
        <Route path="/notifications" element={<Private><NotificationsPage /></Private>} />
        <Route path="/admin"         element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
