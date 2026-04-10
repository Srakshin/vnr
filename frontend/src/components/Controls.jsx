import React, { useEffect } from 'react';
import { Layers, AlertTriangle, Navigation } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { fetchLocalRoads, fetchRoadStatus } from '../services/api';

const Controls = () => {
  const { 
    roadsData, setRoadsData,
    roadsGeoJSON, setRoadsGeoJSON,
    setSmartRouteGeoJSON, setSmartRouteMetadata, setSmartRouteWarning,
    disasters, setDisasters,
    loadingMsg, setLoadingMsg,
    routingMode, setRoutingMode,
    showRoadOverlay, setShowRoadOverlay,
    mapCenter
  } = useAppStore();

  const handleFetchRoads = async () => {
    try {
      setLoadingMsg("Fetching local roads via OSM...");
      const data = await fetchLocalRoads(mapCenter.lat, mapCenter.lng);
      setRoadsData(data);
      setRoadsGeoJSON(null);
      setSmartRouteGeoJSON(null);
      setSmartRouteMetadata(null);
      setSmartRouteWarning("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsg("");
    }
  };

  const handleComputeStatus = async () => {
    if (!roadsData) return;
    try {
      setLoadingMsg("Computing road status overlay...");
      const analyzedData = await fetchRoadStatus({
        roads: roadsData,
        disasters,
      });
      setRoadsGeoJSON(analyzedData);
      setSmartRouteGeoJSON(null);
      setSmartRouteMetadata(null);
      setSmartRouteWarning("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsg("");
    }
  };

  const updateDisasterRadius = (disasterId, radiusKm) => {
    setDisasters(
      disasters.map((disaster) =>
        disaster.id === disasterId
          ? { ...disaster, radius_km: Number(radiusKm) || 0 }
          : disaster
      )
    );
  };

  const hasOverlay = !!roadsGeoJSON?.features?.length;

  useEffect(() => {
    if (!roadsData || !hasOverlay) return;

    const timeoutId = window.setTimeout(() => {
      const refreshOverlay = async () => {
        try {
          setLoadingMsg("Computing road status overlay...");
          const analyzedData = await fetchRoadStatus({
            roads: roadsData,
            disasters,
          });
          setRoadsGeoJSON(analyzedData);
          setSmartRouteGeoJSON(null);
          setSmartRouteMetadata(null);
          setSmartRouteWarning("");
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMsg("");
        }
      };

      refreshOverlay();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    disasters,
    hasOverlay,
    roadsData,
    setLoadingMsg,
    setRoadsGeoJSON,
    setSmartRouteGeoJSON,
    setSmartRouteMetadata,
    setSmartRouteWarning,
  ]);

  return (
    <div className="flex flex-col gap-5 pt-4 border-t border-border mt-2">
      {/* 1. Data Acquisition */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          1. Data Acquisition
        </span>
        <button 
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-zinc-800/80 hover:bg-zinc-700 text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          onClick={handleFetchRoads}
          disabled={!!loadingMsg || !!roadsData}
        >
          <Layers size={18} />
          {loadingMsg.includes("OSM") ? "Fetching..." : "Load Nearby Roads"}
        </button>
      </div>

      {/* 2. AI Analysis */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          2. Disaster Engine
        </span>
        <button 
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          onClick={handleComputeStatus}
          disabled={!roadsData || !!loadingMsg}
        >
          <AlertTriangle size={18} />
          {loadingMsg.includes("overlay") ? "Updating..." : "Generate Road Overlay"}
        </button>
        <div className="grid grid-cols-1 gap-3 mt-2">
          {disasters.map((disaster) => (
            <label
              key={disaster.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-zinc-900/60 px-3 py-3"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {disaster.type} Radius
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={disaster.radius_km}
                  onChange={(event) => updateDisasterRadius(disaster.id, event.target.value)}
                  className="w-full accent-blue-500"
                />
                <span className="w-12 text-right text-sm font-medium text-zinc-200">
                  {disaster.radius_km}km
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Action Plan */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          3. Action Plan
        </span>
        <button 
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 text-sm font-medium rounded-xl transition-all border ${
            routingMode 
            ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
            : 'bg-zinc-800/80 border-border hover:bg-zinc-700 text-zinc-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={() => setRoutingMode(!routingMode)}
          disabled={!roadsGeoJSON || !!loadingMsg}
        >
          <Navigation size={18} />
          {routingMode ? "Click Map for Start / End..." : "Select Smart Route Points"}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-zinc-900/60 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-100">Road Overlay</span>
          <span className="text-xs text-zinc-400">
            {hasOverlay ? "Status layer ready" : "Generate overlay to visualize road risk"}
          </span>
        </div>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            showRoadOverlay
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-300 border border-border'
          }`}
          onClick={() => setShowRoadOverlay(!showRoadOverlay)}
          disabled={!hasOverlay}
        >
          {showRoadOverlay ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export default Controls;
