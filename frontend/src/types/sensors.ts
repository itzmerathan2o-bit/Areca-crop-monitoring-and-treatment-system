export interface SensorData {
  temperature: number;        // Celsius
  humidity: number;           // Percentage
  moisture: number;           // Percentage
  nitrogen: number;           // mg/kg
  phosphorus: number;         // mg/kg
  potassium: number;          // mg/kg
}

export interface SystemData {
  battery: number;            // Percentage
  signal: number;             // dBm
  uptime: number;             // Seconds
}

export interface SensorReading {
  deviceId: string;
  timestamp: string;
  sensors: SensorData;
  system: SystemData;
  ai_processed: boolean;
}

export interface AIRecommendation {
  type: 'watering' | 'fertilizer' | 'environmental' | 'pesticide' | 'harvest';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  quantity?: string;
  frequency?: string;
  reasoning: string;
  confidence: number;         // 0-100
  costEstimate?: number;
}

export interface AIProcessedData {
  deviceId: string;
  timestamp: string;
  recommendations: AIRecommendation[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  cost_estimate: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  farm_name: string;
  location: string;
  devices: string[];
  settings: {
    alert_thresholds: AlertThresholds;
    notifications: boolean;
  };
}

export interface AlertThresholds {
  temperature: {
    critical_min: number;
    critical_max: number;
    optimal_min: number;
    optimal_max: number;
  };
  humidity: {
    critical_min: number;
    critical_max: number;
    optimal_min: number;
    optimal_max: number;
  };
  moisture: {
    critical: number;
    warning: number;
    optimal_min: number;
    optimal_max: number;
    high_max: number;
  };
  nitrogen: {
    critical: number;
    warning: number;
    optimal_min: number;
  };
  phosphorus: {
    critical: number;
    warning: number;
    optimal_min: number;
  };
  potassium: {
    critical: number;
    warning: number;
    optimal_min: number;
  };
}

export interface DashboardData {
  latestReading: SensorReading | null;
  aiRecommendations: AIRecommendation[];
  historicalData: SensorReading[];
  systemStatus: {
    onlineDevices: number;
    totalDevices: number;
    lastUpdate: string;
  };
}

export interface ReportData {
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  sensorData: SensorReading[];
  aiRecommendations: AIRecommendation[];
  summary: {
    totalReadings: number;
    averageTemperature: number;
    averageHumidity: number;
    averageMoisture: number;
    averageNPK: {
      N: number;
      P: number;
      K: number;
    };
    healthStatus: 'healthy' | 'moderate' | 'critical';
    treatmentCount: number;
  };
}

export type SensorStatus = 'optimal' | 'warning' | 'critical';

export interface SensorMetric {
  name: string;
  value: string;
  unit: string;
  status: SensorStatus;
  icon: string;
  trend?: 'up' | 'down';
  change?: number;
}