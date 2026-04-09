import React from 'react';
import { Layers, Activity, Navigation } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { fetchLocalRoads, analyzeDisaster, fetchOptimalRoute } from '../services/api';

const Controls = () => {
  const { 
    roadsData, setRoadsData,
    loadingMsg, setLoadingMsg,
    routingMode, setRoutingMode,
    mapCenter
  } = useAppStore();

  const handleFetchRoads = async () => {
    try {
      setLoadingMsg("Fetching local roads via OSM...");
      const data = await fetchLocalRoads(mapCenter.lat, mapCenter.lng);
      setRoadsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsg("");
    }
  };

  const handleAnalyze = async () => {
    if (!roadsData) return;
    try {
      setLoadingMsg("Simulating AI road analysis...");
      const analyzedData = await analyzeDisaster(roadsData);
      setRoadsData(analyzedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsg("");
    }
  };

  const hasBlocked = roadsData?.features?.some(f => f.properties.status === 'blocked');

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
          2. AI Analysis
        </span>
        <button 
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          onClick={handleAnalyze}
          disabled={!roadsData || !!loadingMsg || hasBlocked}
        >
          <Activity size={18} />
          {loadingMsg.includes("AI") ? "Analyzing..." : "Analyze Disaster Area"}
        </button>
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
          disabled={!roadsData || !!loadingMsg}
        >
          <Navigation size={18} />
          {routingMode ? "Click Map for Start Point..." : "Find Safe Evacuation Route"}
        </button>
      </div>
    </div>
  );
};

export default Controls;
