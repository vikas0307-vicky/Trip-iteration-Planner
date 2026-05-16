import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLORS = {
  Beach: '#2980b9',
  Mountain: '#27ae60',
  Heritage: '#8e44ad',
  Wildlife: '#d35400',
  Adventure: '#e67e22',
  Pilgrimage: '#c0392b',
  Nature: '#16a085',
  City: '#7f8c8d',
}

function getId(dest) {
  return dest?._id || dest?.id || dest?.name
}

function distanceKm(a, b) {
  if (!a || !b) return null
  const toRad = value => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function travelHours(km) {
  if (!km) return null
  return Math.max(1, Math.round(km / 54))
}

function formatHours(hours) {
  if (!hours) return '--'
  if (hours < 24) return `${hours} hr`
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  return rest ? `${days}d ${rest}h` : `${days}d`
}

function routePoints(source, destination) {
  if (!source || !destination) return []
  const points = []
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24
    const curve = Math.sin(Math.PI * t) * 1.4
    points.push([
      source.lat + (destination.lat - source.lat) * t + curve,
      source.lng + (destination.lng - source.lng) * t,
    ])
  }
  return points
}

function makePlaceIcon(type) {
  const isSource = type === 'source'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${isSource ? '#e8f8f5' : '#e74c3c'};
      border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
      color:${isSource ? '#0f766e' : '#fff'};font-weight:800;font-size:12px;
    ">${isSource ? 'S' : 'D'}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function MapFocus({ source, selected }) {
  const map = useMap()

  useEffect(() => {
    if (source && selected && getId(source) !== getId(selected)) {
      map.fitBounds([[source.lat, source.lng], [selected.lat, selected.lng]], { padding: [70, 70] })
    } else if (selected) {
      map.setView([selected.lat, selected.lng], 6)
    }
  }, [map, source, selected])

  return null
}

export default function MapPage() {
  const [destinations, setDestinations] = useState([])
  const [selected, setSelected] = useState(null)
  const [sourceId, setSourceId] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    axios
      .get(`${API}/destinations`)
      .then(res => {
        const loaded = res.data.destinations || []
        setDestinations(loaded)
        setSelected(loaded[1] || loaded[0] || null)
        setSourceId(getId(loaded[0]) || '')
      })
      .catch(() => {})
  }, [])

  const categories = ['All', ...new Set(destinations.map(d => d.category).filter(Boolean))]
  const shown = filter === 'All' ? destinations : destinations.filter(d => d.category === filter)
  const source = destinations.find(d => getId(d) === sourceId)
  const distance = source && selected && getId(source) !== getId(selected)
    ? distanceKm(source, selected)
    : null
  const hours = travelHours(distance)
  const route = source && selected && getId(source) !== getId(selected) ? routePoints(source, selected) : []

  function chooseSource(id) {
    setSourceId(id)
    if (getId(selected) === id) {
      const next = destinations.find(dest => getId(dest) !== id)
      setSelected(next || null)
    }
  }

  function chooseDestination(id) {
    const dest = destinations.find(place => getId(place) === id)
    if (dest) setSelected(dest)
  }

  return (
    <div style={pageStyle}>
      <Navbar />

      <div style={{ display:'flex', height:'calc(100vh - 60px)', fontFamily:'Poppins, sans-serif' }}>
        <div style={sidebarStyle}>
          <div style={{ padding:'20px 16px 12px' }}>
            <h3 style={{ margin:0, color:'#1e3a5f', fontSize:'16px', fontWeight:'700' }}>
              🗺️ Destination Distance
            </h3>
            <p style={{ margin:'4px 0 0', color:'#888', fontSize:'12px' }}>
              Select source and destination
            </p>
          </div>

          <div style={{ padding:'0 16px 14px' }}>
            <label style={{ display:'block', marginBottom:'6px', color:'#444', fontSize:'12px', fontWeight:'700', textTransform:'uppercase' }}>
              Source
            </label>
            <select
              value={sourceId}
              onChange={e => chooseSource(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'10px', outline:'none', fontSize:'13px', fontFamily:'Poppins, sans-serif', color:'#333', background:'#fff' }}
            >
              {destinations.map(dest => (
                <option key={getId(dest)} value={getId(dest)}>{dest.name}</option>
              ))}
            </select>

            <label style={{ display:'block', margin:'12px 0 6px', color:'#444', fontSize:'12px', fontWeight:'700', textTransform:'uppercase' }}>
              Destination
            </label>
            <select
              value={getId(selected) || ''}
              onChange={e => chooseDestination(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:'10px', outline:'none', fontSize:'13px', fontFamily:'Poppins, sans-serif', color:'#333', background:'#fff' }}
            >
              {destinations.map(dest => (
                <option key={getId(dest)} value={getId(dest)}>{dest.name}</option>
              ))}
            </select>

            <div style={{ marginTop:'10px', padding:'12px', borderRadius:'10px', background:'#f8fafc', border:'1px solid #edf2f7' }}>
              <div style={{ color:'#888', fontSize:'11px', fontWeight:'700', textTransform:'uppercase' }}>Route Summary</div>
              <div style={{ color:'#1e3a5f', fontSize:'14px', fontWeight:'700', marginTop:'2px' }}>{source?.name || 'Source'} to {selected?.name || 'Destination'}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'8px' }}>
                <div style={{ color:'#27ae60', fontSize:'18px', fontWeight:'800' }}>
                  {distance ? `${Math.round(distance).toLocaleString()} km` : source && selected ? 'Same' : '--'}
                  <div style={{ color:'#888', fontSize:'10px', fontWeight:'700' }}>Distance</div>
                </div>
                <div style={{ color:'#2980b9', fontSize:'18px', fontWeight:'800' }}>
                  {formatHours(hours)}
                  <div style={{ color:'#888', fontSize:'10px', fontWeight:'700' }}>By road est.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding:'0 16px 12px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding:'4px 12px',
                  borderRadius:'20px',
                  border: filter === cat ? '2px solid #1e3a5f' : '1.5px solid #ddd',
                  background: filter === cat ? '#1e3a5f' : '#fff',
                  color: filter === cat ? '#fff' : '#555',
                  fontSize:'11px',
                  fontWeight:'600',
                  cursor:'pointer',
                  fontFamily:'Poppins, sans-serif',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ overflowY:'auto', flex:1 }}>
            {shown.map(dest => (
              <div
                key={getId(dest)}
                onClick={() => setSelected(dest)}
                style={{
                  padding:'14px 16px',
                  cursor:'pointer',
                  borderLeft: getId(selected) === getId(dest) ? '3px solid #1e3a5f' : '3px solid transparent',
                  background: getId(selected) === getId(dest) ? '#ebf5fb' : 'transparent',
                  display:'flex',
                  alignItems:'center',
                  gap:'12px',
                  borderBottom:'1px solid #f0f0f0',
                }}
              >
                <div style={{
                  width:'10px', height:'10px', borderRadius:'50%',
                  background: COLORS[dest.category] || '#888', flexShrink:0,
                }} />
                <div>
                  <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{dest.name}</div>
                  <div style={{ fontSize:'12px', color:'#888' }}>{dest.state || dest.country}</div>
                  {source && getId(source) !== getId(dest) && (
                    <div style={{ fontSize:'11px', color:'#27ae60', fontWeight:'700', marginTop:'2px' }}>
                      {Math.round(distanceKm(source, dest)).toLocaleString()} km
                    </div>
                  )}
                </div>
                <div style={{
                  marginLeft:'auto', fontSize:'10px', fontWeight:'600',
                  background:(COLORS[dest.category] || '#888') + '22',
                  color:COLORS[dest.category] || '#888',
                  padding:'2px 8px', borderRadius:'10px',
                }}>
                  {dest.category}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={detailStyle}>
              <div style={{ fontWeight:'700', fontSize:'15px', color:'#1e3a5f' }}>{selected.name}</div>
              <div style={{ fontSize:'12px', color:'#888', marginBottom:'6px' }}>{selected.state || selected.country}</div>
              <div style={{ fontSize:'13px', color:'#555' }}>{selected.info}</div>
              {source && distance && (
                <div style={{ marginTop:'10px', padding:'10px', background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', fontSize:'12px', color:'#444' }}>
                  <strong>{Math.round(distance).toLocaleString()} km</strong> from {source.name} to {selected.name}
                </div>
              )}
              <div style={{
                marginTop:'10px', display:'inline-block',
                background:(COLORS[selected.category] || '#888') + '22',
                color:COLORS[selected.category] || '#888',
                padding:'3px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:'600',
              }}>
                {selected.category}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex:1, position:'relative', background:'#111827' }}>
          {distance && (
            <>
              <div style={distanceBadgeStyle}>{Math.round(distance).toLocaleString()} km</div>
              <div style={routeBadgeStyle}>
                <div style={{ fontWeight:'800', fontSize:'13px' }}>{formatHours(hours)}</div>
                <div style={{ fontSize:'11px', opacity:.85 }}>{Math.round(distance).toLocaleString()} km</div>
              </div>
              <div style={routeTitleStyle}>
                <span style={{ color:'#a7f3d0', fontWeight:'800' }}>{source.name}</span>
                <span style={{ color:'#94a3b8' }}> to </span>
                <span style={{ color:'#fecaca', fontWeight:'800' }}>{selected.name}</span>
              </div>
              <button type="button" style={expandButtonStyle}>□</button>
            </>
          )}
          <MapContainer
            center={[22.8, 79.5]}
            zoom={5}
            style={{ width:'100%', height:'100%' }}
          >
            <MapFocus source={source} selected={selected} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />

            {source && selected && getId(source) !== getId(selected) && (
              <>
                <Polyline
                  positions={route}
                  pathOptions={{ color:'#0f172a', weight:9, opacity:0.55 }}
                />
                <Polyline
                  positions={route}
                  pathOptions={{ color:'#7dd3fc', weight:5, opacity:0.95, dashArray:'2 10' }}
                />
                <Marker position={[source.lat, source.lng]} icon={makePlaceIcon('source')}>
                  <Popup>
                    <strong>Source:</strong> {source.name}
                  </Popup>
                </Marker>
                <Marker position={[selected.lat, selected.lng]} icon={makePlaceIcon('destination')}>
                  <Popup>
                    <strong>Destination:</strong> {selected.name}
                  </Popup>
                </Marker>
              </>
            )}

            {shown.map(dest => (
              <Marker
                key={getId(dest)}
                position={[dest.lat, dest.lng]}
                opacity={(source && getId(source) === getId(dest)) || (selected && getId(selected) === getId(dest)) ? 0 : 1}
                eventHandlers={{ click: () => setSelected(dest) }}
              >
                <Popup>
                  <div style={{ fontFamily:'Poppins, sans-serif', minWidth:'160px' }}>
                    <div style={{ fontWeight:'700', fontSize:'15px', color:'#1e3a5f' }}>{dest.name}</div>
                    <div style={{ color:'#888', fontSize:'12px', marginBottom:'6px' }}>{dest.state || dest.country}</div>
                    <div style={{ fontSize:'12px', color:'#555', lineHeight:'1.5' }}>{dest.info}</div>
                    {source && getId(source) !== getId(dest) && (
                      <div style={{ marginTop:'8px', color:'#27ae60', fontSize:'12px', fontWeight:'700' }}>
                        {Math.round(distanceKm(source, dest)).toLocaleString()} km from {source.name}
                      </div>
                    )}
                    <div style={{
                      marginTop:'8px', display:'inline-block',
                      background:'#ebf5fb', color:'#2980b9',
                      padding:'2px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600',
                    }}>
                      {dest.category}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

const pageStyle = { minHeight:'100vh', fontFamily:'Poppins, sans-serif' }

const sidebarStyle = {
  width:'320px',
  flexShrink:0,
  background:'#fff',
  borderRight:'1px solid #e0e0e0',
  display:'flex',
  flexDirection:'column',
  overflowY:'hidden',
}

const detailStyle = {
  padding:'16px',
  borderTop:'1px solid #eee',
  background:'#f9fbfd',
}

const distanceBadgeStyle = {
  position:'absolute',
  top:'18px',
  left:'18px',
  zIndex:500,
  background:'#020617',
  color:'#fff',
  borderRadius:'18px',
  padding:'7px 13px',
  fontSize:'16px',
  fontWeight:'800',
  boxShadow:'0 8px 20px rgba(0,0,0,0.28)',
}

const routeBadgeStyle = {
  position:'absolute',
  left:'50%',
  top:'50%',
  transform:'translate(-50%, -50%)',
  zIndex:500,
  background:'rgba(15,23,42,0.92)',
  color:'#fff',
  borderRadius:'4px',
  padding:'9px 14px',
  textAlign:'center',
  boxShadow:'0 8px 24px rgba(0,0,0,0.32)',
  pointerEvents:'none',
}

const routeTitleStyle = {
  position:'absolute',
  bottom:'18px',
  left:'50%',
  transform:'translateX(-50%)',
  zIndex:500,
  background:'rgba(2,6,23,0.76)',
  color:'#fff',
  borderRadius:'18px',
  padding:'7px 14px',
  fontSize:'13px',
  boxShadow:'0 8px 20px rgba(0,0,0,0.24)',
  pointerEvents:'none',
}

const expandButtonStyle = {
  position:'absolute',
  top:'18px',
  right:'18px',
  zIndex:500,
  width:'40px',
  height:'40px',
  borderRadius:'50%',
  border:'none',
  background:'rgba(2,6,23,0.85)',
  color:'#fff',
  fontSize:'20px',
  fontWeight:'800',
  cursor:'default',
  boxShadow:'0 8px 20px rgba(0,0,0,0.28)',
}
