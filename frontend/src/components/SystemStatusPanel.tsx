import React from 'react';

interface SystemStatusPanelProps {
  systemStatus: any;
  selectedDevice: string;
}

const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ systemStatus, selectedDevice }) => {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getSignalStrengthText = (rssi: number) => {
    if (rssi > -50) return 'Excellent';
    if (rssi > -60) return 'Good';
    if (rssi > -70) return 'Fair';
    return 'Poor';
  };

  const getBatteryStatusColor = (level: number) => {
    if (level > 60) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-300">SYSTEM STATUS</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall System Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Overall Health</h3>

          <div className="mb-6">
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border ${getHealthStatusColor(systemStatus?.healthStatus || 'moderate')}`}>
              <span className="text-2xl">
                {systemStatus?.healthStatus === 'healthy' ? '✅' :
                 systemStatus?.healthStatus === 'critical' ? '🚨' : '⚠️'}
              </span>
              <span className="font-bold uppercase">
                {systemStatus?.healthStatus || 'MODERATE'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-600">
              <span className="text-sm text-gray-400">Total Devices</span>
              <span className="text-lg font-bold text-white">
                {systemStatus?.devices?.total || 0}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-600">
              <span className="text-sm text-gray-400">Online Devices</span>
              <span className="text-lg font-bold text-green-400">
                {systemStatus?.devices?.online || 0}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-600">
              <span className="text-sm text-gray-400">Recent Recommendations</span>
              <span className="text-lg font-bold text-blue-400">
                {systemStatus?.recentRecommendations || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Device Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Device Details</h3>

          {selectedDevice ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Device ID</span>
                  <span className="font-mono text-xs text-green-400">{selectedDevice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getDeviceStatusIcon(systemStatus?.devices?.status?.[selectedDevice] || 'offline')}
                  </span>
                  <span className="text-sm font-semibold capitalize">
                    {systemStatus?.devices?.status?.[selectedDevice] || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 mb-1">Signal Strength</div>
                  <div className="text-lg font-bold text-white">
                    {systemStatus?.devices?.status?.[selectedDevice]?.signal || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStatus?.devices?.status?.[selectedDevice]?.signal &&
                      getSignalStrengthText(systemStatus.devices.status[selectedDevice].signal)}
                  </div>
                </div>

                <div className="p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 mb-1">Battery Level</div>
                  <div className={`text-lg font-bold ${getBatteryStatusColor(systemStatus?.devices?.status?.[selectedDevice]?.battery || 0)}`}>
                    {systemStatus?.devices?.status?.[selectedDevice]?.battery || 'N/A'}%
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        (systemStatus?.devices?.status?.[selectedDevice]?.battery || 0) > 60 ? 'bg-green-500' :
                        (systemStatus?.devices?.status?.[selectedDevice]?.battery || 0) > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${systemStatus?.devices?.status?.[selectedDevice]?.battery || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Last Update</div>
                <div className="text-sm font-semibold text-white">
                  {systemStatus?.lastUpdate ?
                    new Date(systemStatus.lastUpdate).toLocaleString() :
                    'Unknown'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📡</div>
              <p>No device selected</p>
              <p className="text-sm mt-2">Select a device to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Server Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">API Server</span>
                <span className="text-xs text-green-400">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Database</span>
                <span className="text-xs text-green-400">● Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">AI Engine</span>
                <span className="text-xs text-green-400">● Active</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Response Time</span>
                <span className="text-xs text-white">&lt; 100ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Uptime</span>
                <span className="text-xs text-white">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Data Sync</span>
                <span className="text-xs text-green-400">Real-time</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Version</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Dashboard</span>
                <span className="text-xs text-white">v2.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">AI Engine</span>
                <span className="text-xs text-white">v2.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Last Updated</span>
                <span className="text-xs text-white">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPanel;