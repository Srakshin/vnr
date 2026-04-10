import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Core Data
  roadsData: null,
  roadsGeoJSON: null,
  routeData: null,
  smartRouteGeoJSON: null,
  smartRouteMetadata: null,
  smartRouteWarning: "",
  disasters: [
    {
      id: 'flood-hyd-default',
      type: 'flood',
      center: [17.3753, 78.4744],
      radius_km: 2,
    },
    {
      id: 'earthquake-hyd-default',
      type: 'earthquake',
      center: [17.3853, 78.4844],
      radius_km: 5,
    },
  ],
  
  // UI States
  loadingMsg: "",
  routingMode: false,
  showRoadOverlay: true,
  
  // Map Interactions
  routePoints: [],
  mapCenter: { lng: 78.4744, lat: 17.3753, zoom: 13 }, // Default to Hyderabad

  // Actions
  setRoadsData: (data) => set({ roadsData: data }),
  setRoadsGeoJSON: (data) => set({ roadsGeoJSON: data }),
  setRouteData: (data) => set({ routeData: data }),
  setSmartRouteGeoJSON: (data) => set({ smartRouteGeoJSON: data }),
  setSmartRouteMetadata: (metadata) => set({ smartRouteMetadata: metadata }),
  setSmartRouteWarning: (smartRouteWarning) => set({ smartRouteWarning }),
  setDisasters: (disasters) => set({ disasters }),
  setLoadingMsg: (msg) => set({ loadingMsg: msg }),
  setRoutingMode: (mode) => set({ routingMode: mode, routePoints: mode ? get().routePoints : [] }),
  setShowRoadOverlay: (showRoadOverlay) => set({ showRoadOverlay }),
  setRoutePoints: (points) => set({ routePoints: points }),
  setMapCenter: (center) => set({ mapCenter: center }),
  
  clearRoutePoints: () => set({ routePoints: [] }),
  resetAll: () => set({
    roadsData: null,
    roadsGeoJSON: null,
    routeData: null,
    smartRouteGeoJSON: null,
    smartRouteMetadata: null,
    smartRouteWarning: "",
    routingMode: false,
    showRoadOverlay: true,
    routePoints: [],
    loadingMsg: ""
  })
}));

export default useAppStore;
