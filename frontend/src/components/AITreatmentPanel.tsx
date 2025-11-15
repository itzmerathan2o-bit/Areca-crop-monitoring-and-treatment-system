import React from 'react';
import { AIRecommendation } from '../types/sensors';

interface AITreatmentPanelProps {
  recommendations: AIRecommendation[];
}

const AITreatmentPanel: React.FC<AITreatmentPanelProps> = ({ recommendations }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return '💧';
      case 'fertilizer':
        return '🌱';
      case 'environmental':
        return '🌡️';
      case 'pesticide':
        return '🚨';
      case 'harvest':
        return '🌾';
      default:
        return '📋';
    }
  };

  const getTotalCost = () => {
    return recommendations.reduce((sum, rec) => sum + (rec.costEstimate || 0), 0);
  };

  const getCriticalCount = () => {
    return recommendations.filter(rec => rec.priority === 'critical').length;
  };

  const getHighCount = () => {
    return recommendations.filter(rec => rec.priority === 'high').length;
  };

  if (recommendations.length === 0) {
    return (
      <div className="px-6 py-8 bg-gray-850 border-y border-gray-700">
        <h2 className="text-xl font-bold mb-6 text-gray-300">🤖 AI TREATMENT RECOMMENDATIONS</h2>
        <div className="text-center text-gray-500 py-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-lg font-semibold text-green-400 mb-2">All Systems Optimal!</p>
          <p>No treatment recommendations at this time. Your areca crops are healthy.</p>
          <p className="text-sm mt-2">Continue monitoring for any changes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-gray-850 border-y border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-300">🤖 AI TREATMENT RECOMMENDATIONS</h2>
        <div className="flex items-center gap-4">
          {getCriticalCount() > 0 && (
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
              🚨 {getCriticalCount()} Critical
            </span>
          )}
          {getHighCount() > 0 && (
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
              ⚠️ {getHighCount()} High Priority
            </span>
          )}
          <span className="text-gray-400 text-sm">
            Total Cost: Rs. {getTotalCost().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-6 bg-gray-800 hover:bg-gray-750 transition-all duration-200 ${getPriorityColor(rec.priority)}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getActionIcon(rec.type)}</span>
                <div>
                  <h3 className="font-bold text-sm text-white capitalize">
                    {rec.type} Recommendation
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getPriorityBadgeColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Confidence</div>
                <div className="text-lg font-bold text-white">{rec.confidence}%</div>
              </div>
            </div>

            {/* Action */}
            <div className="mb-3">
              <p className="text-white font-semibold mb-1">{rec.action}</p>
              {rec.quantity && (
                <p className="text-green-400 text-sm font-medium">
                  Quantity: {rec.quantity}
                </p>
              )}
              {rec.frequency && (
                <p className="text-blue-400 text-sm">
                  Frequency: {rec.frequency}
                </p>
              )}
            </div>

            {/* Reasoning */}
            <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-600">
              <p className="text-xs text-gray-300 leading-relaxed">{rec.reasoning}</p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-700">
              <span className="text-gray-400">
                {rec.type === 'watering' && '💧 Irrigation'}
                {rec.type === 'fertilizer' && '🌱 Nutrition'}
                {rec.type === 'environmental' && '🌡️ Climate Control'}
                {rec.type === 'pesticide' && '🚨 Disease Prevention'}
                {rec.type === 'harvest' && '🌾 Harvest Ready'}
              </span>
              {rec.costEstimate !== undefined && (
                <span className="text-yellow-400 font-semibold">
                  Rs. {rec.costEstimate.toFixed(2)}
                </span>
              )}
            </div>

            {/* Priority Indicator */}
            <div className={`mt-3 text-center text-xs py-1 rounded ${
              rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
              rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
              rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {rec.priority === 'critical' && '🚨 Take Action Immediately'}
              {rec.priority === 'high' && '⚠️ Address Within 24 Hours'}
              {rec.priority === 'medium' && '📅 Plan Within Week'}
              {rec.priority === 'low' && '👁️ Monitor for Changes'}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400 text-sm">Summary: </span>
            <span className="text-white text-sm font-semibold">
              {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400">Total Cost</div>
              <div className="text-lg font-bold text-yellow-400">
                Rs. {getTotalCost().toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Avg Confidence</div>
              <div className="text-lg font-bold text-green-400">
                {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITreatmentPanel;