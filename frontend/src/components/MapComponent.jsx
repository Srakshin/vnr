import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import useAppStore from '../store/useAppStore';
import { fetchOptimalRoute } from '../services/api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const { 
    roadsData, routeData, routingMode, setRoutingMode, 
    routePoints, setRoutePoints, setRouteData, 
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
      // Roads layer setup
      map.current.addSource('roads', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'roads-layer',
        type: 'line',
        source: 'roads',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'accessible', '#10b981', // emerald-500
            'blocked', '#ef4444',    // red-500
            '#94a3b8' // bg-slate-400
          ],
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Route layer setup
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#facc15', // yellow-400
          'line-width': 6,
          'line-opacity': 0.9,
          'line-blur': 1,
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

  // Sync roads data to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('roads');
    if (source) {
      source.setData(roadsData || { type: 'FeatureCollection', features: [] });
    }
  }, [roadsData]);

  // Sync route data to map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('route');
    if (source) {
      source.setData(routeData || { type: 'FeatureCollection', features: [] });
    }
  }, [routeData]);

  // Handle map clicks for routing
  useEffect(() => {
    if (!map.current) return;
    
    const clickHandler = async (e) => {
      if (!routingMode) return;
      
      const pt = [e.lngLat.lng, e.lngLat.lat];
      
      const currentPoints = useAppStore.getState().routePoints;
      
      if (currentPoints.length === 0) {
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
        
        // Trigger fetch route immediately
        setLoadingMsg("Calculating safe route...");
        try {
          const rData = await fetchOptimalRoute(newPoints[0], newPoints[1]);
          setRouteData(rData);
          setLoadingMsg("");
        } catch (err) {
          console.error(err);
          setLoadingMsg("Failed to calculate route");
        }
        setRoutingMode(false); // disable point picking
      }
    };

    map.current.on('click', clickHandler);
    return () => map.current.off('click', clickHandler);
  }, [routingMode, setRoutePoints, setLoadingMsg, setRouteData, setRoutingMode]);

  // Cleanup markers on reset
  useEffect(() => {
    if (routePoints.length === 0) {
      if (startMarkerRef.current) startMarkerRef.current.remove();
      if (endMarkerRef.current) endMarkerRef.current.remove();
    }
  }, [routePoints]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
};

export default MapComponent;
