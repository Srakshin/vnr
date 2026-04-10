import React from 'react';
import useAppStore from '../store/useAppStore';

const Legend = () => {
  const {
    roadsData,
    roadsGeoJSON,
    routeData,
    smartRouteGeoJSON,
    smartRouteMetadata,
    smartRouteWarning,
    resetAll,
    loadingMsg,
  } = useAppStore();

  if (!roadsData && !roadsGeoJSON && !routeData && !smartRouteGeoJSON) return null;

  return (
    <div className="flex flex-col gap-4 mt-2 border-t border-border pt-4">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        Legend
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="w-4 h-4 rounded-[4px] bg-red-500"></div> 
          <span>Blocked Road</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="w-4 h-4 rounded-[4px] bg-yellow-400"></div> 
          <span>Risky Road</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="w-4 h-4 rounded-[4px] bg-emerald-500"></div> 
          <span>Safe Road</span>
        </div>
        {routeData && (
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="w-4 h-4 rounded-[4px] bg-sky-400"></div> 
            <span>Safe Evacuation Route</span>
          </div>
        )}
        {smartRouteGeoJSON && (
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="w-4 h-4 rounded-[4px] bg-indigo-500"></div>
            <span>Smart Route</span>
          </div>
        )}
      </div>

      {smartRouteMetadata && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-zinc-300">
          <div className="flex items-center justify-between">
            <span>Distance</span>
            <span>{(smartRouteMetadata.distance / 1000).toFixed(2)} km</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>ETA</span>
            <span>{Math.ceil(smartRouteMetadata.duration / 60)} min</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Risky roads used</span>
            <span>{smartRouteMetadata.risky_roads_used}</span>
          </div>
        </div>
      )}

      {smartRouteWarning && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {smartRouteWarning}
        </div>
      )}

      <button 
        className="w-full py-2.5 px-4 mt-2 bg-zinc-800 hover:bg-zinc-700 border border-border text-zinc-300 text-sm font-medium rounded-xl transition-all"
        onClick={resetAll}
        disabled={!!loadingMsg}
      >
        Reset Simulation
      </button>
    </div>
  );
};

export default Legend;
