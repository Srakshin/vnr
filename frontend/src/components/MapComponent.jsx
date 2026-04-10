import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import useAppStore from '../store/useAppStore';
import { fetchSmartRoute } from '../services/api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const { 
    roadsData,
    roadsGeoJSON,
    routeData,
    smartRouteGeoJSON,
    routingMode,
    showRoadOverlay,
    setRoutingMode, 
    routePoints,
    setRoutePoints,
    setRouteData,
    setSmartRouteGeoJSON,
    setSmartRouteMetadata,
    setSmartRouteWarning,
    setMapCenter,
    setLoadingMsg
  } = useAppStore();

  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Default config reading from store's initial state
    const { lng, lat, zoom } = useAppStore.getState().mapCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.on('style.load', () => {
      const {
        roadsData: initialRoadsData,
        roadsGeoJSON: initialRoadsGeoJSON,
        routeData: initialRouteData,
        smartRouteGeoJSON: initialSmartRouteGeoJSON,
        showRoadOverlay: initialShowRoadOverlay,
      } = useAppStore.getState();

      // Base road network source
      map.current.addSource('roads-base', {
        type: 'geojson',
        data: initialRoadsData || { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'roads-base-layer',
        type: 'line',
        source: 'roads-base',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#64748b',
          'line-width': 2,
          'line-opacity': 0.35,
          'line-width-transition': { duration: 250 },
          'line-opacity-transition': { duration: 250 }
        }
      });

      // Status overlay source
      map.current.addSource('roads-overlay', {
        type: 'geojson',
        data: initialRoadsGeoJSON || { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'roads-overlay-layer',
        type: 'line',
        source: 'roads-overlay',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: initialShowRoadOverlay ? 'visible' : 'none'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'blocked', '#ef4444',
            'risky', '#facc15',
            'safe', '#22c55e',
            '#94a3b8'
          ],
          'line-width': [
            'match',
            ['get', 'status'],
            'blocked', 5,
            'risky', 4,
            'safe', 3,
            2
          ],
          'line-opacity': 0.92,
          'line-color-transition': { duration: 300 },
          'line-width-transition': { duration: 300 },
          'line-opacity-transition': { duration: 300 }
        }
      });

      // Route layer setup
      map.current.addSource('route', {
        type: 'geojson',
        data: initialRouteData || { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 6,
          'line-opacity': 0.9,
          'line-blur': 1,
        }
      });

      map.current.addSource('smart-route', {
        type: 'geojson',
        data: initialSmartRouteGeoJSON || { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'smart-route-layer',
        type: 'line',
        source: 'smart-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#6366f1',
          'line-width': 7,
          'line-opacity': 0.95,
          'line-blur': 0.6,
          'line-color-transition': { duration: 250 },
          'line-width-transition': { duration: 250 }
        }
      });
    });

    map.current.on('move', () => {
      setMapCenter({
        lng: map.current.getCenter().lng.toFixed(4),
        lat: map.current.getCenter().lat.toFixed(4),
        zoom: map.current.getZoom().toFixed(2)
      });
    });
  }, [setMapCenter]);

  // Sync base roads to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('roads-base');
    if (source) {
      source.setData(roadsData || { type: 'FeatureCollection', features: [] });
    }
  }, [roadsData]);

  // Sync status overlay to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('roads-overlay');
    if (source) {
      source.setData(roadsGeoJSON || { type: 'FeatureCollection', features: [] });
    }
  }, [roadsGeoJSON]);

  // Toggle overlay visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer('roads-overlay-layer')) return;
    map.current.setLayoutProperty(
      'roads-overlay-layer',
      'visibility',
      showRoadOverlay ? 'visible' : 'none'
    );
  }, [showRoadOverlay]);

  // Sync route data to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('route');
    if (source) {
      source.setData(routeData || { type: 'FeatureCollection', features: [] });
    }
  }, [routeData]);

  // Sync smart route data to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('smart-route');
    if (source) {
      source.setData(smartRouteGeoJSON || { type: 'FeatureCollection', features: [] });
    }
  }, [smartRouteGeoJSON]);

  // Handle map clicks for routing
  useEffect(() => {
    if (!map.current) return;
    
    const clickHandler = (e) => {
      if (!routingMode) return;
      
      const pt = [e.lngLat.lng, e.lngLat.lat];
      
      const currentPoints = useAppStore.getState().routePoints;
      
      if (currentPoints.length === 0) {
        setSmartRouteGeoJSON(null);
        setSmartRouteMetadata(null);
        setSmartRouteWarning("");
        setRouteData(null);
        if (startMarkerRef.current) {
          startMarkerRef.current.remove();
        }
        if (endMarkerRef.current) {
          endMarkerRef.current.remove();
        }

        // Create start marker
        startMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat(pt)
          .addTo(map.current);
        setRoutePoints([pt]);
      } else if (currentPoints.length === 1) {
        // Create end marker
        endMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(pt)
          .addTo(map.current);
        
        const newPoints = [currentPoints[0], pt];
        setRoutePoints(newPoints);
        setRoutingMode(false); // disable point picking
      }
    };

    map.current.on('click', clickHandler);
    return () => map.current.off('click', clickHandler);
  }, [
    routingMode,
    setRouteData,
    setRoutePoints,
    setRoutingMode,
    setSmartRouteGeoJSON,
    setSmartRouteMetadata,
    setSmartRouteWarning,
  ]);

  // Cleanup markers on reset
  useEffect(() => {
    if (routePoints.length === 0) {
      if (startMarkerRef.current) startMarkerRef.current.remove();
      if (endMarkerRef.current) endMarkerRef.current.remove();
    }
  }, [routePoints]);

  const canRequestSmartRoute = routePoints.length === 2 && !!roadsGeoJSON && !routingMode;

  const handleSmartRoute = async () => {
    if (!canRequestSmartRoute) {
      return;
    }

    try {
      setLoadingMsg("Calculating smart route...");
      setSmartRouteWarning("");
      const response = await fetchSmartRoute({
        roads: roadsGeoJSON,
        start: routePoints[0],
        end: routePoints[1],
      });

      setSmartRouteGeoJSON(response.route);
      setSmartRouteMetadata(response.metadata);
      setSmartRouteWarning(response.metadata?.warning || "");
      setRouteData(null);
      setLoadingMsg("");
    } catch (err) {
      console.error(err);
      setSmartRouteGeoJSON(null);
      setSmartRouteMetadata(null);
      setSmartRouteWarning(err?.response?.data?.detail || "Failed to calculate smart route");
      setLoadingMsg("Failed to calculate smart route");
    }
  };

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0 h-full w-full transition-opacity duration-300" />
      <div className="pointer-events-none absolute right-6 bottom-6 z-20 flex flex-col items-end gap-3">
        <button
          type="button"
          className={`pointer-events-auto rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            canRequestSmartRoute
              ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30'
              : 'border-white/10 bg-zinc-900/70 text-zinc-500'
          }`}
          disabled={!canRequestSmartRoute}
          onClick={handleSmartRoute}
        >
          Smart Route
        </button>
      </div>
    </>
  );
};

export default MapComponent;
