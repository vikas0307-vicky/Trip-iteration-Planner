import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

const WEATHER_PLACES = [
  { name:'Goa', state:'Goa', lat:15.2993, lng:74.1240 },
  { name:'Manali', state:'Himachal Pradesh', lat:32.2396, lng:77.1887 },
  { name:'Jaipur', state:'Rajasthan', lat:26.9124, lng:75.7873 },
  { name:'Munnar', state:'Kerala', lat:10.0889, lng:77.0595 },
  { name:'Darjeeling', state:'West Bengal', lat:27.0360, lng:88.2627 },
  { name:'Shillong', state:'Meghalaya', lat:25.5788, lng:91.8933 },
]

const INDIA_PLACES = [
  ...WEATHER_PLACES,
  { name:'Agra', state:'Uttar Pradesh', lat:27.1767, lng:78.0081 },
  { name:'Udaipur', state:'Rajasthan', lat:24.5854, lng:73.7125 },
  { name:'Jaisalmer', state:'Rajasthan', lat:26.9157, lng:70.9083 },
  { name:'Varanasi', state:'Uttar Pradesh', lat:25.3176, lng:82.9739 },
  { name:'Rishikesh', state:'Uttarakhand', lat:30.0869, lng:78.2676 },
  { name:'Ooty', state:'Tamil Nadu', lat:11.4102, lng:76.6950 },
  { name:'Leh Ladakh', state:'Ladakh', lat:34.1526, lng:77.5770 },
]

const WEATHER_CODES = {
  0:'Sunny', 1:'Mostly sunny', 2:'Cloudy', 3:'Cloudy',
  45:'Foggy', 48:'Foggy', 51:'Rainy', 53:'Rainy', 55:'Rainy',
  61:'Rainy', 63:'Rainy', 65:'Heavy rain', 71:'Winter', 73:'Winter', 75:'Winter',
  80:'Rainy', 81:'Rainy', 82:'Heavy rain', 95:'Stormy', 96:'Stormy',
}

const WMO_ICONS = {
  0:'Sunny', 1:'Mostly sunny', 2:'Partly cloudy', 3:'Cloudy',
  45:'Fog', 48:'Fog', 51:'Drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain', 71:'Light snow', 73:'Snow', 75:'Heavy snow',
  80:'Showers', 81:'Showers', 82:'Heavy showers', 95:'Storm', 96:'Storm',
}

function weatherMood(code, temp) {
  if ([51,53,55,61,63,65,80,81,82,95,96].includes(code)) return { label:'Rainy', icon:'Rain', color:'#2980b9', bg:'#ebf5fb' }
  if ([71,73,75].includes(code) || temp <= 15) return { label:'Winter/Cool', icon:'Cold', color:'#5dade2', bg:'#eaf2ff' }
  if ([0,1].includes(code) || temp >= 28) return { label:'Sunny', icon:'Sun', color:'#e67e22', bg:'#fff3cd' }
  return { label: WEATHER_CODES[code] || 'Pleasant', icon:'Cloud', color:'#64748b', bg:'#f1f5f9' }
}

export default function ChatbotPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role:'bot', text:"👋 Hi! I'm your Travel Assistant!\n\nI can help you find:\n• Best destinations by season (summer/winter/monsoon)\n• Beach, mountain, heritage, wildlife places\n• Budget & luxury hotels across India\n• Travel tips and advice\n\nWhat kind of trip are you planning? 🌍", results:null }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [forecast, setForecast] = useState([])
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherCity, setWeatherCity] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  useEffect(() => {
    async function loadForecast() {
      setWeatherLoading(true)
      try {
        const results = await Promise.all(WEATHER_PLACES.map(async place => {
          const res = await fetch(
            `${WEATHER_URL}?latitude=${place.lat}&longitude=${place.lng}` +
            `&current=temperature_2m,weather_code,precipitation,wind_speed_10m&timezone=auto`
          )
          const data = await res.json()
          const current = data.current || {}
          return {
            ...place,
            temp: Math.round(current.temperature_2m),
            code: current.weather_code,
            rain: current.precipitation || 0,
            wind: Math.round(current.wind_speed_10m || 0),
            mood: weatherMood(current.weather_code, current.temperature_2m),
          }
        }))
        setForecast(results)
      } catch {
        setForecast(WEATHER_PLACES.map(place => ({
          ...place,
          temp: null,
          code: null,
          rain: 0,
          wind: 0,
          mood: { label:'Forecast unavailable', icon:'Weather', color:'#64748b', bg:'#f1f5f9' },
        })))
      } finally {
        setWeatherLoading(false)
      }
    }
    loadForecast()
  }, [])

  const QUICK = [
    '🌊 Beach destinations in summer',
    '❄️ Best places in winter',
    '🏔️ Hill stations to visit',
    '🐯 Wildlife safari places',
    '🏰 Heritage sites in Rajasthan',
    'I want to go Jaipur',
    'Jaipur weather forecast',
    '💰 Budget travel in India',
    '⛩️ Pilgrimage destinations',
    '🌧️ Monsoon travel places',
  ]

  function extractWeatherCity(text) {
    const cleaned = text.toLowerCase().replace(/[?.!,]/g, ' ')
    const known = INDIA_PLACES.find(p => cleaned.includes(p.name.toLowerCase()))
    if (known) return known.name

    const patterns = [
      /weather\s+(?:in|for|at)?\s*([a-z ]+)/i,
      /forecast\s+(?:in|for|at)?\s*([a-z ]+)/i,
      /(?:in|for|at)\s+([a-z ]+)\s+weather/i,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[1]) return match[1].replace(/\b(today|tomorrow|india|please)\b/gi, '').trim()
    }
    return ''
  }

  async function fetchIndiaWeather(placeName) {
    let place = INDIA_PLACES.find(p => p.name.toLowerCase() === placeName.toLowerCase())

    if (!place) {
      const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(placeName)}&count=1&countryCode=IN`)
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error('India place not found')
      const found = geoData.results[0]
      place = { name:found.name, state:found.admin1 || 'India', lat:found.latitude, lng:found.longitude }
    }

    const res = await fetch(
      `${WEATHER_URL}?latitude=${place.lat}&longitude=${place.lng}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=auto&forecast_days=7`
    )
    const data = await res.json()
    return { ...data, place }
  }

  function weatherReply(data) {
    const cur = data.current || {}
    const label = WMO_ICONS[cur.weather_code] || WEATHER_CODES[cur.weather_code] || 'Weather'
    return `India Weather Forecast for ${data.place.name}, ${data.place.state}\n\nCurrent: ${Math.round(cur.temperature_2m)} C, ${label}\nHumidity: ${cur.relative_humidity_2m}% | Wind: ${Math.round(cur.wind_speed_10m || 0)} km/h | Rain: ${cur.precipitation || 0} mm\n\n7-day forecast is shown below.`
  }

  async function sendWeatherMessage(placeName) {
    const city = placeName.trim()
    if (!city) return
    setInput('')
    setWeatherCity(city)
    setMessages(p => [...p, { role:'user', text:`Weather forecast for ${city}` }])
    setLoading(true)
    try {
      const weather = await fetchIndiaWeather(city)
      setMessages(p => [...p, { role:'bot', text:weatherReply(weather), results:{ weather } }])
    } catch {
      setMessages(p => [...p, { role:'bot', text:'I could not load that India weather forecast right now. Try Jaipur, Goa, Manali, Delhi, or another Indian city.', results:null }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg) return
    const wantsWeather = /weather|forecast|temperature|rain|rainy|climate/i.test(msg)
    const cityForWeather = extractWeatherCity(msg)
    if (wantsWeather && cityForWeather) {
      await sendWeatherMessage(cityForWeather)
      return
    }
    setInput('')
    setMessages(p => [...p, { role:'user', text:msg }])
    setLoading(true)
    try {
      const res  = await fetch(`${API}/chatbot`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:msg }) })
      const data = await res.json()
      setMessages(p => [...p, { role:'bot', text:data.reply, results:data.results }])
    } catch {
      setMessages(p => [...p, { role:'bot', text:'Sorry, I could not connect. Make sure the backend is running!', results:null }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'20px', height:'calc(100vh - 60px)', display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🤖</div>
          <div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#1e3a5f' }}>Travel Assistant</h2>
            <p style={{ margin:0, fontSize:'13px', color:'#27ae60', fontWeight:'600' }}>● Online · Powered by AI</p>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', padding:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', marginBottom:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px', marginBottom:'10px', flexWrap:'wrap' }}>
            <div>
              <h3 style={{ margin:0, fontSize:'15px', color:'#1e3a5f', fontWeight:'800' }}>India Weather Forecast</h3>
              <p style={{ margin:'2px 0 0', color:'#888', fontSize:'12px' }}>See where it is sunny, rainy, or winter-cool before you ask the assistant.</p>
            </div>
            <button onClick={() => navigate('/weather')} style={{ padding:'7px 12px', background:'#f8fafc', color:'#1e3a5f', border:'1px solid #d8e2ec', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Full Weather
            </button>
          </div>
          <form
            onSubmit={e => { e.preventDefault(); sendWeatherMessage(weatherCity) }}
            style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}
          >
            <input
              value={weatherCity}
              onChange={e => setWeatherCity(e.target.value)}
              placeholder="Search India weather... e.g. Jaipur"
              style={{ flex:'1 1 220px', padding:'10px 12px', border:'1.5px solid #d8e2ec', borderRadius:'10px', fontSize:'13px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            />
            <button
              type="submit"
              disabled={loading || !weatherCity.trim()}
              style={{ padding:'10px 14px', background:loading?'#94a3b8':'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
            >
              Get Forecast
            </button>
          </form>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'8px' }}>
            {(weatherLoading ? WEATHER_PLACES : forecast).map(place => (
              <button
                key={place.name}
                type="button"
                onClick={() => sendMessage(`Tell me about ${place.name} weather and best season to visit`)}
                style={{ textAlign:'left', background:place.mood?.bg || '#f8fafc', border:'1px solid #e0e7ef', borderRadius:'12px', padding:'10px', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'center' }}>
                  <span style={{ color:'#1e3a5f', fontSize:'13px', fontWeight:'800' }}>{place.name}</span>
                  <span style={{ color:place.mood?.color || '#64748b', fontSize:'11px', fontWeight:'800' }}>{weatherLoading ? 'Loading' : place.mood?.label}</span>
                </div>
                <div style={{ color:'#64748b', fontSize:'11px', marginTop:'4px' }}>{place.state}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px', color:'#334155', fontSize:'12px', fontWeight:'700' }}>
                  <span>{weatherLoading || place.temp === null ? '--' : `${place.temp} C`}</span>
                  <span>{place.mood?.icon || 'Weather'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div style={{ flex:1, background:'#fff', borderRadius:'16px', padding:'16px', overflowY:'auto', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', marginBottom:'12px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom:'16px', display:'flex', flexDirection:'column', alignItems: msg.role==='user' ? 'flex-end' : 'flex-start' }}>
              {/* Bubble */}
              <div style={{
                maxWidth:'80%', padding:'12px 16px', borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role==='user' ? 'linear-gradient(135deg,#1e3a5f,#2980b9)' : '#f8fafc',
                color: msg.role==='user' ? '#fff' : '#333',
                fontSize:'14px', lineHeight:'1.6', whiteSpace:'pre-wrap',
                border: msg.role==='bot' ? '1px solid #eee' : 'none',
              }}>
                {msg.text}
              </div>

              {/* Weather forecast cards */}
              {msg.results?.weather?.daily && (
                <div style={{ width:'100%', marginTop:'12px', background:'#fff', border:'1px solid #e0e7ef', borderRadius:'12px', padding:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#1e3a5f', margin:'0 0 10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    7-Day Forecast - {msg.results.weather.place.name}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(92px,1fr))', gap:'8px' }}>
                    {msg.results.weather.daily.time.map((day, index) => (
                      <div key={day} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px 8px', textAlign:'center' }}>
                        <div style={{ color:'#64748b', fontSize:'11px', fontWeight:'700' }}>
                          {new Date(day).toLocaleDateString('en', { weekday:'short' })}
                        </div>
                        <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'800', marginTop:'5px' }}>
                          {WMO_ICONS[msg.results.weather.daily.weather_code[index]] || 'Weather'}
                        </div>
                        <div style={{ color:'#334155', fontSize:'13px', fontWeight:'800', marginTop:'5px' }}>
                          {Math.round(msg.results.weather.daily.temperature_2m_max[index])} C
                        </div>
                        <div style={{ color:'#64748b', fontSize:'11px' }}>
                          Low {Math.round(msg.results.weather.daily.temperature_2m_min[index])} C
                        </div>
                        {msg.results.weather.daily.precipitation_sum[index] > 0 && (
                          <div style={{ color:'#2980b9', fontSize:'11px', fontWeight:'700', marginTop:'4px' }}>
                            Rain {msg.results.weather.daily.precipitation_sum[index]}mm
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination cards */}
              {msg.results?.destinations?.length > 0 && (
                <div style={{ width:'100%', marginTop:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>🌍 Recommended Destinations</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}>
                    {msg.results.destinations.map(d => (
                      <div key={d._id} onClick={() => navigate(`/india/${d._id}`)}
                        style={{ background:'linear-gradient(135deg,#1e3a5f,#2980b9)', borderRadius:'12px', padding:'14px', cursor:'pointer', color:'#fff', transition:'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='none'}>
                        <div style={{ fontWeight:'700', fontSize:'15px' }}>{d.name}</div>
                        <div style={{ fontSize:'12px', opacity:.8, marginTop:'2px' }}>📍 {d.state}</div>
                        <div style={{ fontSize:'12px', opacity:.8, marginTop:'2px' }}>📅 {d.bestSeason?.join(', ')}</div>
                        <div style={{ marginTop:'6px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                          <span>⭐ {d.rating}</span>
                          <span>💰 ₹{d.avgBudgetPerDay}/day</span>
                        </div>
                        <div style={{ marginTop:'6px', background:'rgba(255,255,255,0.2)', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', fontWeight:'600', textAlign:'center' }}>
                          {d.category}
                        </div>
                        {d.topAttractions?.length > 0 && (
                          <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                            {d.topAttractions.slice(0, 4).map(place => (
                              <span key={place} style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'6px', padding:'3px 6px', fontSize:'10px', fontWeight:'700' }}>
                                {place}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Places with hotels */}
              {msg.results?.placesToVisit?.length > 0 && (
                <div style={{ width:'100%', marginTop:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Places To Visit + Hotels</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:'10px' }}>
                    {msg.results.placesToVisit.map(place => (
                      <div key={place.name} style={{ background:'#fff', border:'1px solid #e0e7ef', borderRadius:'12px', padding:'12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'flex-start', marginBottom:'6px' }}>
                          <div>
                            <div style={{ color:'#1e3a5f', fontSize:'14px', fontWeight:'800' }}>{place.name}</div>
                            <div style={{ color:'#64748b', fontSize:'11px', marginTop:'2px' }}>{place.area} - {place.type}</div>
                          </div>
                          <span style={{ background:'#fff3cd', color:'#9a6a00', borderRadius:'10px', padding:'3px 7px', fontSize:'10px', fontWeight:'800', whiteSpace:'nowrap' }}>{place.bestTime}</span>
                        </div>
                        <p style={{ color:'#555', fontSize:'12px', lineHeight:'1.5', margin:'0 0 8px' }}>{place.description}</p>
                        {place.hotels?.length > 0 && (
                          <div>
                            <div style={{ color:'#1e3a5f', fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                              Hotels Available ({place.hotels.length})
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                              {place.hotels.map(h => (
                                <div key={`${place.name}-${h._id}`} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'9px', padding:'8px', display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'center' }}>
                                  <div style={{ minWidth:0, flex:1 }}>
                                    <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</div>
                                    <div style={{ color:'#888', fontSize:'11px', marginTop:'2px' }}>₹{h.price?.toLocaleString()}/night · ⭐ {h.rating}</div>
                                    <div style={{ color:'#64748b', fontSize:'10px', lineHeight:'1.4', marginTop:'2px' }}>{h.nearbyNote}</div>
                                  </div>
                                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                                    <button onClick={() => navigate(`/hotels/${h._id}`)} style={{ padding:'5px 8px', background:'#fff', color:'#1e3a5f', border:'1px solid #1e3a5f', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                      View
                                    </button>
                                    <button onClick={() => navigate(`/hotels/${h._id}#booking`)} style={{ padding:'5px 8px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                      Book
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotel cards */}
              {msg.results?.hotels?.length > 0 && (
                <div style={{ width:'100%', marginTop:'10px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>🏨 Available Hotels</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {msg.results.hotels.map(h => (
                      <div key={h._id} onClick={() => navigate(`/hotels/${h._id}`)}
                        style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', transition:'all 0.2s', flexWrap:'wrap' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.background='#f0f4f8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.background='#fff' }}>
                        <div style={{ minWidth:'180px', flex:'1 1 220px' }}>
                          <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>🏨 {h.name}</div>
                          <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>📍 {h.location}</div>
                        </div>
                        <div style={{ display:'flex', gap:'8px', flex:'1 1 100%', justifyContent:'flex-end', order:3 }}>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}`) }}
                            style={{ padding:'8px 12px', background:'#fff', color:'#1e3a5f', border:'1.5px solid #1e3a5f', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}#booking`) }}
                            style={{ padding:'8px 12px', background:'linear-gradient(135deg,#27ae60,#2ecc71)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
                          >
                            Book & Pay
                          </button>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontWeight:'700', color:'#1e3a5f', fontSize:'15px' }}>₹{h.price?.toLocaleString()}<span style={{ fontSize:'10px', color:'#888', fontWeight:'400' }}>/night</span></div>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'10px', fontWeight:'600',
                            background: h.category==='Luxury' ? '#f3e5ff' : h.category==='Budget' ? '#e8f8f5' : '#ebf5fb',
                            color:      h.category==='Luxury' ? '#8e44ad' : h.category==='Budget' ? '#27ae60' : '#2980b9',
                          }}>{h.category} ⭐{h.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:'6px', padding:'12px 16px', background:'#f8fafc', borderRadius:'18px 18px 18px 4px', width:'fit-content', border:'1px solid #eee' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2980b9', animation:`bounce 1s ${i*0.2}s infinite` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => sendMessage(q)} style={{ padding:'6px 12px', background:'#fff', border:'1.5px solid #ddd', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontFamily:'Poppins,sans-serif', color:'#555', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.color='#1e3a5f' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.color='#555' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:'10px' }}>
          <input
            style={{ flex:1, padding:'14px 18px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            placeholder="Ask me anything... e.g. 'Best beach places in summer'"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !loading && sendMessage()}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding:'14px 22px', background: loading?'#aaa':'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:'700' }}>
            Send ✈️
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }`}</style>
    </div>
  )
}
