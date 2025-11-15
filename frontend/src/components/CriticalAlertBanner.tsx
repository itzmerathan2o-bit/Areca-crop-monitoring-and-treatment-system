import React from 'react';
import { AIRecommendation } from '../types/sensors';

interface CriticalAlertBannerProps {
  recommendations: AIRecommendation[];
}

const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return null;
  }

  const criticalCount = recommendations.length;

  return (
    <div className="bg-red-600 border-b-2 border-red-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <span className="font-bold text-white">CRITICAL ALERTS</span>
              <span className="ml-2 bg-red-800 text-white px-2 py-1 rounded-full text-sm">
                {criticalCount} {criticalCount === 1 ? 'ISSUE' : 'ISSUES'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <span key={index} className="bg-red-700/50 text-white px-3 py-1 rounded text-sm">
                {rec.type === 'watering' && '💧 Watering Needed'}
                {rec.type === 'fertilizer' && '🌱 Nutrient Deficiency'}
                {rec.type === 'environmental' && '🌡️ Environmental Issue'}
                {rec.action}
              </span>
            ))}
            {recommendations.length > 3 && (
              <span className="bg-red-700/50 text-white px-3 py-1 rounded text-sm">
                +{recommendations.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            View Recommendations
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-red-200 hover:text-white text-sm underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriticalAlertBanner;