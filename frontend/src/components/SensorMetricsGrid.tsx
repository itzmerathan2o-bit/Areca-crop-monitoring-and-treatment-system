import React from 'react';
import { SensorMetric } from '../types/sensors';

interface SensorMetricsGridProps {
  metrics: SensorMetric[];
}

const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({ metrics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'OPTIMAL';
      case 'warning':
        return 'WARNING';
      case 'critical':
        return 'CRITICAL';
      default:
        return 'UNKNOWN';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down') => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  const getTrendColor = (trend?: 'up' | 'down', change?: number) => {
    if (!trend || change === undefined) return 'text-gray-500';
    if (Math.abs(change) < 1) return 'text-gray-500';
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  if (metrics.length === 0) {
    return (
      <div className="px-6 py-8">
        <h2 className="text-xl font-bold mb-6 text-gray-300">SENSOR METRICS</h2>
        <div className="text-center text-gray-500 py-8">
          <div className="text-6xl mb-4">📡</div>
          <p>No sensor data available</p>
          <p className="text-sm mt-2">Please check device connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-300">SENSOR METRICS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`border-2 ${getStatusColor(metric.status)} rounded-lg p-6 bg-gray-800 hover:bg-gray-750 transition-all duration-200 transform hover:scale-105`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {metric.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-light text-white">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-400">
                    {metric.unit}
                  </span>
                </div>
              </div>
              <div className="text-2xl">{metric.icon}</div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${getStatusIndicator(metric.status)}`}></div>
                <span className="text-gray-400 uppercase">
                  {getStatusText(metric.status)}
                </span>
              </div>
              {metric.trend && (
                <div className={`text-xs ${getTrendColor(metric.trend, metric.change)}`}>
                  {getTrendIcon(metric.trend)} {Math.abs(metric.change || 0).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
              {metric.status === 'optimal' && '✓ All systems normal'}
              {metric.status === 'warning' && '⚠ Monitor closely'}
              {metric.status === 'critical' && '🚨 Immediate attention required'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorMetricsGrid;