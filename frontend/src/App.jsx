import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import { Layers, Activity, Route, MapPin, Loader2, Navigation } from 'lucide-react';
import './index.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Local Backend URL
const API_BASE = 'http://localhost:8000/api';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(78.4744); // Hyderabad roughly
  const [lat, setLat] = useState(17.3753);
  const [zoom, setZoom] = useState(13);

  const [loadingMsg, setLoadingMsg] = useState("");
  const [roadsData, setRoadsData] = useState(null);
  const [routingMode, setRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [routeData, setRouteData] = useState(null);

  // Markers
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.on('style.load', () => {
      // Add empty roads source
      map.current.addSource('roads', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add road lines layer
      map.current.addLayer({
        id: 'roads-layer',
        type: 'line',
        source: 'roads',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'accessible', '#10b981', // green
            'blocked', '#ef4444',    // red
            '#94a3b8' // slate/unknown
          ],
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Add empty route source
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add route line layer
      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#facc15', // yellow
          'line-width': 6,
          'line-opacity': 0.9,
          'line-blur': 1,
        }
      });
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  // Handle map click for routing mode
  useEffect(() => {
    if (!map.current) return;
    
    const clickHandler = (e) => {
      if (!routingMode) return;
      
      const pt = [e.lngLat.lng, e.lngLat.lat];
      
      setRoutePoints(prev => {
        if (prev.length === 0) {
          // Set start
          startMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat(pt)
            .addTo(map.current);
          return [pt];
        } else if (prev.length === 1) {
          // Set end
          endMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat(pt)
            .addTo(map.current);
          return [prev[0], pt];
        }
        return prev;
      });
    };

    map.current.on('click', clickHandler);
    return () => map.current.off('click', clickHandler);
  }, [routingMode]);

  // Fetch route when points are exactly 2
  useEffect(() => {
    if (routePoints.length === 2) {
      fetchOptimalRoute(routePoints[0], routePoints[1]);
    }
  }, [routePoints]);

  const fetchRoads = async () => {
    try {
      setLoadingMsg("Fetching local roads via OSM...");
      const center = map.current.getCenter();
      const res = await axios.get(`${API_BASE}/roads`, {
        params: { lat: center.lat, lon: center.lng, radius: 800 }
      });
      
      setRoadsData(res.data);
      map.current.getSource('roads').setData(res.data);
      setLoadingMsg("");
    } catch (err) {
      console.error(err);
      setLoadingMsg("Failed to fetch roads.");
    }
  };

  const analyzeDisaster = async () => {
    if (!roadsData) return;
    try {
      setLoadingMsg("Simulating AI road analysis...");
      const res = await axios.post(`${API_BASE}/analyze`, { roads: roadsData });
      
      setRoadsData(res.data);
      map.current.getSource('roads').setData(res.data);
      setLoadingMsg("");
    } catch (err) {
      console.error(err);
      setLoadingMsg("Failed to analyze roads.");
    }
  };

  const fetchOptimalRoute = async (start, end) => {
    try {
      setLoadingMsg("Calculating safe route via OSRM...");
      const res = await axios.get(`${API_BASE}/route`, {
        params: {
          start_lat: start[1], start_lon: start[0],
          end_lat: end[1], end_lon: end[0]
        }
      });
      
      setRouteData(res.data);
      map.current.getSource('route').setData(res.data);
      setLoadingMsg("Safe route identified.");
      setRoutingMode(false);
    } catch (err) {
      console.error(err);
      setLoadingMsg("Failed to find optimal route.");
      setRoutingMode(false);
    }
  };

  const resetAll = () => {
    setRoutePoints([]);
    setRouteData(null);
    setRoadsData(null);
    setRoutingMode(false);
    setLoadingMsg("");
    if (map.current) {
      map.current.getSource('roads').setData({ type: 'FeatureCollection', features: [] });
      map.current.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    }
    if (startMarkerRef.current) startMarkerRef.current.remove();
    if (endMarkerRef.current) endMarkerRef.current.remove();
  };

  return (
    <>
      <div ref={mapContainer} className="map-container" />
      
      <div className="sidebar">
        <div className="header">
          <h1>DisasterAI</h1>
          <p>Road Damage Assessment & Safe Routing</p>
        </div>

        <div className="status-box">
          <div className="flex items-center gap-2 mb-1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} />
            <span style={{ fontWeight: 600 }}>Location</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Lng: {lng} | Lat: {lat} | Zoom: {zoom}
          </div>
        </div>

        <div className="section">
          <span className="section-title">1. Data Acquisition</span>
          <button className="btn" onClick={fetchRoads} disabled={!!loadingMsg || roadsData}>
            <Layers size={18} />
            {loadingMsg.includes("OSM") ? "Fetching..." : "Load Nearby Roads"}
          </button>
        </div>

        <div className="section">
          <span className="section-title">2. AI Analysis</span>
          <button 
            className="btn btn-primary" 
            onClick={analyzeDisaster} 
            disabled={!roadsData || !!loadingMsg || roadsData?.features?.some(f => f.properties.status === 'blocked')}
          >
            <Activity size={18} />
            Analyze Disaster Area
          </button>
        </div>

        <div className="section">
          <span className="section-title">3. Action Plan</span>
          <button 
            className="btn" 
            onClick={() => setRoutingMode(!routingMode)} 
            disabled={!roadsData || !!loadingMsg || routePoints.length === 2}
            style={routingMode ? { borderColor: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)' } : {}}
          >
            <Navigation size={18} />
            {routingMode ? "Click Map for Points..." : "Find Safe Evacuation Route"}
          </button>
          {routingMode && routePoints.length < 2 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
              Select {routePoints.length === 0 ? "Start" : "End"} point on the map.
            </p>
          )}
        </div>

        {(roadsData || routeData) && (
          <div className="section">
            <span className="section-title">Legend</span>
            <div className="legend">
              <div className="legend-item"><div className="color-box color-accessible"></div> Accessible Road</div>
              <div className="legend-item"><div className="color-box color-blocked"></div> Blocked Road (Damage)</div>
              {routeData && <div className="legend-item"><div className="color-box color-route"></div> Safe AI Route</div>}
            </div>
            
            <button className="btn" onClick={resetAll} style={{ marginTop: '10px' }} disabled={!!loadingMsg}>
              Reset Simulation
            </button>
          </div>
        )}

        {loadingMsg && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-primary)', marginTop: 'auto', paddingTop: '10px' }}>
            <Loader2 className="spinner" size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{loadingMsg}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
