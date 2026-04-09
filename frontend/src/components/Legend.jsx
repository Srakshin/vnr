import React from 'react';
import useAppStore from '../store/useAppStore';

const Legend = () => {
  const { roadsData, routeData, resetAll, loadingMsg } = useAppStore();

  if (!roadsData && !routeData) return null;

  return (
    <div className="flex flex-col gap-4 mt-2 border-t border-border pt-4">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        Legend
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="w-4 h-4 rounded-[4px] bg-emerald-500"></div> 
          <span>Accessible Road</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="w-4 h-4 rounded-[4px] bg-red-500"></div> 
          <span>Blocked Road (Damage)</span>
        </div>
        {routeData && (
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="w-4 h-4 rounded-[4px] bg-yellow-400"></div> 
            <span>Safe Evacuation Route</span>
          </div>
        )}
      </div>

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
