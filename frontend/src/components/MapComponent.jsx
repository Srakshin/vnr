import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import useAppStore from '../store/useAppStore';
import { fetchOptimalRoute } from '../services/api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const { 
    roadsData, roadsGeoJSON, routeData, routingMode, showRoadOverlay, setRoutingMode, 
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
      const {
        roadsData: initialRoadsData,
        roadsGeoJSON: initialRoadsGeoJSON,
        routeData: initialRouteData,
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

  return <div ref={mapContainer} className="absolute inset-0 h-full w-full transition-opacity duration-300" />;
};

export default MapComponent;
