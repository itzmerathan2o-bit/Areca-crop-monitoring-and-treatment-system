import React from 'react';
import { SensorReading } from '../types/sensors';

interface AnalyticsSectionProps {
  historicalData: SensorReading[];
  latestReading: SensorReading | null;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ historicalData, latestReading }) => {
  const getTimeSeriesData = (sensorType: keyof SensorReading['sensors']) => {
    return historicalData.slice(-24).map(reading => ({
      time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: reading.sensors[sensorType]
    }));
  };

  const getAverageValue = (sensorType: keyof SensorReading['sensors']) => {
    if (historicalData.length === 0) return 0;
    const sum = historicalData.reduce((acc, reading) => acc + reading.sensors[sensorType], 0);
    return (sum / historicalData.length).toFixed(1);
  };

  const getMinMax = (sensorType: keyof SensorReading['sensors']) => {
    if (historicalData.length === 0) return { min: 0, max: 0 };
    const values = historicalData.map(reading => reading.sensors[sensorType]);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const ChartPlaceholder: React.FC<{ title: string; color: string }> = ({ title, color }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-sm font-bold mb-4 text-gray-400">{title}</h3>
      <div className="h-48 flex items-center justify-center bg-gray-900 rounded border border-gray-700 relative overflow-hidden">
        {/* Mock chart visualization */}
        <div className="absolute inset-0 flex items-end justify-around p-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={`w-2 ${color} opacity-70 rounded-t`}
              style={{ height: `${Math.random() * 80 + 20}%` }}
            ></div>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-gray-500 text-sm">Chart visualization</p>
          <p className="text-gray-600 text-xs">Live data will appear here</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-300">📊 PERFORMANCE ANALYTICS</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Environmental Trends Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4 text-gray-400">ENVIRONMENTAL TRENDS (24H)</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Temperature</div>
              <div className="text-lg font-bold text-orange-400">
                {latestReading?.sensors.temperature.toFixed(1) || 'N/A'}°C
              </div>
              <div className="text-xs text-gray-500">
                Avg: {getAverageValue('temperature')}°C
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Humidity</div>
              <div className="text-lg font-bold text-blue-400">
                {latestReading?.sensors.humidity.toFixed(0) || 'N/A'}%
              </div>
              <div className="text-xs text-gray-500">
                Avg: {getAverageValue('humidity')}%
              </div>
            </div>
          </div>
          <div className="h-32 flex items-center justify-center bg-gray-900 rounded border border-gray-700 relative">
            <div className="absolute inset-0 flex items-end justify-around p-2">
              {historicalData.slice(-12).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-1 bg-orange-500 opacity-70 rounded-t"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  ></div>
                  <div
                    className="w-1 bg-blue-500 opacity-70 rounded-t"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="relative z-10 text-center">
              <p className="text-gray-500 text-xs">Temperature & Humidity</p>
            </div>
          </div>
        </div>

        {/* NPK Levels Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4 text-gray-400">NPK NUTRIENT LEVELS</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {latestReading?.sensors.nitrogen.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">N (mg/kg)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">
                {latestReading?.sensors.phosphorus.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">P (mg/kg)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {latestReading?.sensors.potassium.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">K (mg/kg)</div>
            </div>
          </div>
          <div className="h-32 flex items-center justify-center bg-gray-900 rounded border border-gray-700">
            <div className="relative z-10 text-center">
              <div className="flex justify-center gap-4 mb-2">
                <div className="w-12 h-20 bg-green-500/30 rounded flex items-end justify-center">
                  <div className="w-10 bg-green-500 rounded-t" style={{ height: '70%' }}></div>
                </div>
                <div className="w-12 h-20 bg-yellow-500/30 rounded flex items-end justify-center">
                  <div className="w-10 bg-yellow-500 rounded-t" style={{ height: '50%' }}></div>
                </div>
                <div className="w-12 h-20 bg-purple-500/30 rounded flex items-end justify-center">
                  <div className="w-10 bg-purple-500 rounded-t" style={{ height: '85%' }}></div>
                </div>
              </div>
              <p className="text-gray-500 text-xs">Current NPK Levels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Soil Moisture Analysis */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4 text-gray-400">SOIL MOISTURE ANALYSIS</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Current</span>
              <span className="text-lg font-bold text-cyan-400">
                {latestReading?.sensors.moisture.toFixed(1) || 'N/A'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Average (24h)</span>
              <span className="text-sm font-semibold text-gray-300">
                {getAverageValue('moisture')}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Range</span>
              <span className="text-sm font-semibold text-gray-300">
                {getMinMax('moisture').min.toFixed(0)} - {getMinMax('moisture').max.toFixed(0)}%
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Status</div>
              {(() => {
                const moisture = latestReading?.sensors.moisture || 0;
                if (moisture < 25) {
                  return <div className="text-red-400 text-sm font-semibold">🚨 Critical - Water Immediately</div>;
                } else if (moisture < 50) {
                  return <div className="text-yellow-400 text-sm font-semibold">💧 Low - Water Soon</div>;
                } else if (moisture > 75) {
                  return <div className="text-blue-400 text-sm font-semibold">🌊 High - Reduce Watering</div>;
                } else {
                  return <div className="text-green-400 text-sm font-semibold">✅ Optimal</div>;
                }
              })()}
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4 text-gray-400">SYSTEM PERFORMANCE</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Data Points</span>
              <span className="text-sm font-semibold text-gray-300">{historicalData.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Update Frequency</span>
              <span className="text-sm font-semibold text-gray-300">5 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Signal Strength</span>
              <span className="text-sm font-semibold text-green-400">
                {latestReading?.system.signal || 'N/A'} dBm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Battery Level</span>
              <span className="text-sm font-semibold text-green-400">
                {latestReading?.system.battery || 'N/A'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Uptime</span>
              <span className="text-sm font-semibold text-gray-300">
                {latestReading?.system.uptime ? `${Math.floor(latestReading.system.uptime / 3600)}h` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4 text-gray-400">QUICK STATS</h3>
          <div className="space-y-3">
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Total Readings Today</div>
              <div className="text-xl font-bold text-green-400">
                {historicalData.filter(r => {
                  const today = new Date().toDateString();
                  return new Date(r.timestamp).toDateString() === today;
                }).length}
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">System Health</div>
              <div className="text-xl font-bold text-green-400">
                {(() => {
                  if (!latestReading) return 'Unknown';
                  const critical = Object.values(latestReading.sensors).some((val, idx) => {
                    const thresholds = [
                      [20, 35], // Temperature
                      [40, 90], // Humidity
                      [25, 75], // Moisture
                      [200, 999], // Nitrogen
                      [30, 999], // Phosphorus
                      [150, 999]  // Potassium
                    ];
                    const [min, max] = thresholds[idx];
                    return val < min || val > max;
                  });
                  return critical ? 'Warning' : 'Good';
                })()}
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Last Reading</div>
              <div className="text-sm font-semibold text-gray-300">
                {latestReading ? new Date(latestReading.timestamp).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;