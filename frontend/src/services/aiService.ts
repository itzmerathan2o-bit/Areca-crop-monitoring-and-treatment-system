import axios from 'axios';
import { SensorReading, AIRecommendation } from '../types/sensors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class AIService {
  private apiBase = API_BASE_URL;

  // Process sensor data to get AI recommendations
  async processSensorData(deviceId: string, sensorReading: SensorReading): Promise<AIRecommendation[]> {
    try {
      const response = await axios.post(`${this.apiBase}/ai/process-sensor-data`, {
        deviceId,
        timestamp: sensorReading.timestamp,
        sensorData: sensorReading
      });

      return response.data.recommendations;
    } catch (error: any) {
      console.error('AI processing error:', error);
      throw new Error(error.response?.data?.error || 'Failed to process sensor data');
    }
  }

  // Get treatment recommendations for a specific time period
  async getTreatmentHistory(deviceId: string, startDate: Date, endDate: Date): Promise<AIRecommendation[]> {
    try {
      const response = await axios.get(`${this.apiBase}/ai/treatment-history`, {
        params: {
          deviceId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      return response.data.recommendations;
    } catch (error: any) {
      console.error('Failed to fetch treatment history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch treatment history');
    }
  }

  // Get AI insights and analytics
  async getAIInsights(deviceId: string, period: 'week' | 'month' | 'quarter'): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBase}/ai/insights`, {
        params: { deviceId, period }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch AI insights:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch AI insights');
    }
  }

  // Get cost analysis for treatments
  async getCostAnalysis(deviceId: string, period: 'week' | 'month' | 'quarter'): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBase}/ai/cost-analysis`, {
        params: { deviceId, period }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch cost analysis:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch cost analysis');
    }
  }

  // Update treatment feedback (to improve AI recommendations)
  async submitTreatmentFeedback(deviceId: string, recommendationId: string, feedback: {
    applied: boolean;
    effectiveness: number; // 1-5 scale
    notes?: string;
  }): Promise<void> {
    try {
      await axios.post(`${this.apiBase}/ai/feedback`, {
        deviceId,
        recommendationId,
        feedback
      });
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit feedback');
    }
  }
}

export const aiService = new AIService();