import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Core Data
  roadsData: null,
  routeData: null,
  
  // UI States
  loadingMsg: "",
  routingMode: false,
  
  // Map Interactions
  routePoints: [],
  mapCenter: { lng: 78.4744, lat: 17.3753, zoom: 13 }, // Default to Hyderabad

  // Actions
  setRoadsData: (data) => set({ roadsData: data }),
  setRouteData: (data) => set({ routeData: data }),
  setLoadingMsg: (msg) => set({ loadingMsg: msg }),
  setRoutingMode: (mode) => set({ routingMode: mode, routePoints: mode ? get().routePoints : [] }),
  setRoutePoints: (points) => set({ routePoints: points }),
  setMapCenter: (center) => set({ mapCenter: center }),
  
  clearRoutePoints: () => set({ routePoints: [] }),
  resetAll: () => set({
    roadsData: null,
    routeData: null,
    routingMode: false,
    routePoints: [],
    loadingMsg: ""
  })
}));

export default useAppStore;
