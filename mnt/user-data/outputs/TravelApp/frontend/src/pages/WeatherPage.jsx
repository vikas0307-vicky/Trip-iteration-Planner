import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

const WMO_CODES = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Foggy', 48:'Icy fog', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain', 71:'Light snow', 73:'Snow', 75:'Heavy snow',
  80:'Rain showers', 81:'Showers', 82:'Heavy showers', 95:'Thunderstorm', 96:'Thunderstorm with hail',
}

const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️', 45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️', 61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'❄️', 75:'❄️', 80:'🌦️', 81:'🌧️', 82:'⛈️', 95:'⛈️', 96:'⛈️',
}

const INDIA_PLACES = [
  { name:'Goa', state:'Goa', lat:15.2993, lng:74.1240 },
  { name:'Manali', state:'Himachal Pradesh', lat:32.2396, lng:77.1887 },
  { name:'Kerala Backwaters', state:'Kerala', lat:9.4981, lng:76.3388 },
  { name:'Jaipur', state:'Rajasthan', lat:26.9124, lng:75.7873 },
  { name:'Varanasi', state:'Uttar Pradesh', lat:25.3176, lng:82.9739 },
  { name:'Darjeeling', state:'West Bengal', lat:27.0360, lng:88.2627 },
  { name:'Agra', state:'Uttar Pradesh', lat:27.1767, lng:78.0081 },
  { name:'Andaman Islands', state:'Andaman & Nicobar', lat:11.7401, lng:92.6586 },
  { name:'Rishikesh', state:'Uttarakhand', lat:30.0869, lng:78.2676 },
  { name:'Udaipur', state:'Rajasthan', lat:24.5854, lng:73.7125 },
  { name:'Coorg', state:'Karnataka', lat:12.4244, lng:75.7382 },
  { name:'Spiti Valley', state:'Himachal Pradesh', lat:32.2461, lng:78.0344 },
  { name:'Mysore', state:'Karnataka', lat:12.2958, lng:76.6394 },
  { name:'Leh Ladakh', state:'Ladakh', lat:34.1526, lng:77.5770 },
  { name:'Munnar', state:'Kerala', lat:10.0889, lng:77.0595 },
  { name:'Hampi', state:'Karnataka', lat:15.3350, lng:76.4600 },
  { name:'Ooty', state:'Tamil Nadu', lat:11.4102, lng:76.6950 },
  { name:'Jim Corbett', state:'Uttarakhand', lat:29.5300, lng:78.7747 },
  { name:'Amritsar', state:'Punjab', lat:31.6340, lng:74.8723 },
  { name:'Kolkata', state:'West Bengal', lat:22.5726, lng:88.3639 },
  { name:'Khajuraho', state:'Madhya Pradesh', lat:24.8318, lng:79.9199 },
  { name:'Rann of Kutch', state:'Gujarat', lat:23.7337, lng:69.8597 },
  { name:'Shillong', state:'Meghalaya', lat:25.5788, lng:91.8933 },
  { name:'Jaisalmer', state:'Rajasthan', lat:26.9157, lng:70.9083 },
  { name:'Puri', state:'Odisha', lat:19.8134, lng:85.8312 },
]

export default function WeatherPage() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadWeather(place) {
    setLoading(true)
    setError('')
    setWeather(null)
    try {
      const wRes = await fetch(
        `${WEATHER_URL}?latitude=${place.lat}&longitude=${place.lng}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto&forecast_days=7`
      )
      const wData = await wRes.json()
      setCity(place.name)
      setWeather({ ...wData, cityName: place.name, state: place.state, country: 'India' })
    } catch {
      setError('Could not load weather right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function searchWeather(e) {
    e.preventDefault()
    if (!city.trim()) return

    const match = INDIA_PLACES.find(p => p.name.toLowerCase() === city.trim().toLowerCase())
    if (match) {
      loadWeather(match)
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)
    try {
      const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&countryCode=IN`)
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error('India place not found. Try one of the listed destinations.')

      const { latitude, longitude, name, admin1, country } = geoData.results[0]
      const wRes = await fetch(
        `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto&forecast_days=7`
      )
      const wData = await wRes.json()
      setWeather({ ...wData, cityName: name, state: admin1, country })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cur = weather?.current

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', marginBottom:'6px' }}>
          🌤️ India Weather Forecast
        </h2>
        <p style={{ color:'#888', marginBottom:'24px', fontSize:'14px' }}>
          Check live weather for the same India places shown on the Incredible India page
        </p>

        <form onSubmit={searchWeather} style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
          <input
            style={{ flex:1, padding:'13px 16px', border:'1.5px solid #ddd', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            placeholder="🔍 Search India places... e.g. Goa, Manali, Jaipur"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <button type="submit" disabled={loading} style={{
            padding:'13px 24px', background:'#1e3a5f', color:'#fff', border:'none',
            borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif',
          }}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', marginBottom:'24px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <p style={{ margin:'0 0 12px', fontSize:'13px', fontWeight:'700', color:'#1e3a5f', textTransform:'uppercase', letterSpacing:'0.05em' }}>India Places</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {INDIA_PLACES.map(place => (
              <button
                key={place.name}
                type="button"
                onClick={() => loadWeather(place)}
                style={{ padding:'7px 12px', background:city===place.name?'#1e3a5f':'#f8fafc', color:city===place.name?'#fff':'#444', border:'1.5px solid', borderColor:city===place.name?'#1e3a5f':'#e0e0e0', borderRadius:'20px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
              >
                {place.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background:'#ffeaea', border:'1px solid #f5c6c6', color:'#c0392b', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px' }}>
            ❌ {error}
          </div>
        )}

        {cur && (
          <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2980b9)', borderRadius:'16px', padding:'28px', color:'#fff', marginBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <div style={{ fontSize:'14px', opacity:.8, marginBottom:'4px' }}>Current weather in</div>
                <div style={{ fontSize:'28px', fontWeight:'700' }}>{weather.cityName}, {weather.state || weather.country}</div>
                <div style={{ fontSize:'16px', opacity:.85, marginTop:'6px' }}>
                  {WMO_CODES[cur.weather_code] || 'Unknown'}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'72px', lineHeight:1 }}>{WMO_ICONS[cur.weather_code] || '🌡️'}</div>
                <div style={{ fontSize:'48px', fontWeight:'700', marginTop:'4px' }}>{cur.temperature_2m}°C</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginTop:'24px' }}>
              {[
                { label:'Humidity', value: cur.relative_humidity_2m + '%', icon:'💧' },
                { label:'Wind Speed', value: cur.wind_speed_10m + ' km/h', icon:'💨' },
                { label:'Forecast', value: '7 days', icon:'📅' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:'24px' }}>{s.icon}</div>
                  <div style={{ fontSize:'18px', fontWeight:'700', marginTop:'4px' }}>{s.value}</div>
                  <div style={{ fontSize:'12px', opacity:.8, marginTop:'2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {weather?.daily && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 16px', fontSize:'16px' }}>📅 7-Day Forecast</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'12px' }}>
              {weather.daily.time.map((day, i) => (
                <div key={day} style={{ textAlign:'center', padding:'12px 8px', background:'#f8fafc', borderRadius:'10px' }}>
                  <div style={{ fontSize:'12px', color:'#888', marginBottom:'6px' }}>
                    {new Date(day).toLocaleDateString('en', { weekday:'short' })}
                  </div>
                  <div style={{ fontSize:'24px', margin:'4px 0' }}>{WMO_ICONS[weather.daily.weather_code[i]] || '🌡️'}</div>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#1e3a5f' }}>{Math.round(weather.daily.temperature_2m_max[i])}°</div>
                  <div style={{ fontSize:'12px', color:'#888' }}>{Math.round(weather.daily.temperature_2m_min[i])}°</div>
                  {weather.daily.precipitation_sum[i] > 0 && (
                    <div style={{ fontSize:'11px', color:'#2980b9', marginTop:'4px' }}>
                      💧{weather.daily.precipitation_sum[i]}mm
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <div style={{ textAlign:'center', padding:'60px', background:'#fff', borderRadius:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:'60px', marginBottom:'16px' }}>🇮🇳</div>
            <h3 style={{ color:'#1e3a5f', marginBottom:'8px' }}>Choose an India destination</h3>
            <p style={{ color:'#888', fontSize:'14px' }}>Get live weather and 7-day forecast before planning your trip</p>
          </div>
        )}
      </div>
    </div>
  )
}
