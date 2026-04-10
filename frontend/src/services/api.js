import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchLocalRoads = async (lat, lon, radius = 800) => {
  const res = await axios.get(`${API_BASE}/roads`, {
    params: { lat, lon, radius }
  });
  return res.data;
};

export const analyzeDisaster = async (roadsData) => {
  const res = await axios.post(`${API_BASE}/analyze`, { roads: roadsData });
  return res.data;
};

export const fetchRoadStatus = async (payload) => {
  const res = await axios.post(`${API_BASE}/roads/status`, payload);
  return res.data;
};

export const fetchOptimalRoute = async (startLngLat, endLngLat) => {
  const res = await axios.get(`${API_BASE}/route`, {
    params: {
      start_lat: startLngLat[1], 
      start_lon: startLngLat[0],
      end_lat: endLngLat[1], 
      end_lon: endLngLat[0]
    }
  });
  return res.data;
};

export const fetchSmartRoute = async (payload) => {
  const res = await axios.post(`${API_BASE}/route/smart`, payload);
  return res.data;
};
