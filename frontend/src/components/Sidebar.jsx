import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Controls from './Controls';
import Legend from './Legend';

const Sidebar = () => {
  const { mapCenter, loadingMsg } = useAppStore();

  return (
    <div className="absolute top-6 left-6 w-[360px] max-h-[calc(100vh-48px)] flex flex-col bg-panel backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 z-10 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col mb-5">
        <h1 className="text-2xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent mb-1">
          Disaster AI
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Road Damage Assessment & Safe Routing
        </p>
      </div>

      {/* Location Status */}
      <div className="bg-white/5 border-l-4 border-blue-500 p-3 rounded-lg flex flex-col gap-1">
        <div className="flex items-center gap-2 text-zinc-200">
          <MapPin size={16} className="text-blue-400" />
          <span className="text-sm font-semibold">Live Location</span>
        </div>
        <div className="text-xs text-zinc-400 font-mono tracking-tight">
          {mapCenter.lng}°, {mapCenter.lat}° | Zoom: {mapCenter.zoom}
        </div>
      </div>

      {/* Main Controls Section */}
      <Controls />

      {/* Legend & Summary */}
      <Legend />

      {/* Loading Overlay / Toast inside sidebar */}
      {loadingMsg && (
        <div className="mt-4 py-2 border-t border-border flex items-center justify-center gap-2 text-blue-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium animate-pulse">{loadingMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
