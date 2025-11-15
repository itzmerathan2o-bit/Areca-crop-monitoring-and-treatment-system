import React from 'react';

interface StatusBarProps {
  user: any;
  selectedDevice: string;
  onLogout: () => void;
  systemStatus: any;
}

const StatusBar: React.FC<StatusBarProps> = ({ user, selectedDevice, onLogout, systemStatus }) => {
  const isOnline = systemStatus?.healthStatus !== 'critical';
  const lastUpdate = systemStatus?.lastUpdate || new Date().toISOString();

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            SYSTEM {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span>DEVICE: {selectedDevice || 'NONE SELECTED'}</span>
          <span>LAST UPDATE: {new Date(lastUpdate).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>NODES: {systemStatus?.devices?.online || 0}/{systemStatus?.devices?.total || 0} ONLINE</span>
          <span>BATTERY: {systemStatus?.devices?.status?.[selectedDevice]?.battery || 'N/A'}%</span>
          <span>SIGNAL: {systemStatus?.devices?.status?.[selectedDevice]?.signal || 'N/A'} dBm</span>
          <div className="flex items-center gap-2">
            <span>👤 {user?.email?.split('@')[0]}</span>
            <button
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;