import React, { useState, useEffect } from 'react';
import { SensorReading, AIRecommendation, SensorMetric } from '../types/sensors';
import { firebaseService } from '../services/firebaseService';
import { authService } from '../services/authService';
import { reportService } from '../services/reportService';

// Components
import StatusBar from './StatusBar';
import SensorMetricsGrid from './SensorMetricsGrid';
import AITreatmentPanel from './AITreatmentPanel';
import AnalyticsSection from './AnalyticsSection';
import SystemStatusPanel from './SystemStatusPanel';
import CriticalAlertBanner from './CriticalAlertBanner';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication state
    const unsubscribeAuth = authService.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserData(currentUser.uid);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile
      const userProfile = await firebaseService.getUserProfile(userId);
      if (userProfile && userProfile.devices.length > 0) {
        const deviceId = userProfile.devices[0];
        setSelectedDevice(deviceId);

        // Load device data
        await loadDeviceData(deviceId);
      } else {
        setError('No devices found. Please register a device first.');
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceData = async (deviceId: string) => {
    try {
      // Subscribe to real-time sensor data
      const unsubscribeSensor = firebaseService.subscribeToSensorData(
        deviceId,
        (data) => {
          if (data) {
            setLatestReading(data);
          }
        }
      );

      // Subscribe to AI recommendations
      const unsubscribeAI = firebaseService.subscribeToAIRecommendations(
        deviceId,
        (recommendations) => {
          if (recommendations && recommendations.length > 0) {
            const latestRecommendations = recommendations[recommendations.length - 1];
            setAIRecommendations(latestRecommendations.recommendations || []);
          }
        }
      );

      // Load historical data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      const historical = await firebaseService.getHistoricalData(deviceId, startDate, endDate);
      setHistoricalData(historical);

      // Cleanup subscriptions
      return () => {
        unsubscribeSensor?.();
        unsubscribeAI?.();
      };
    } catch (err: any) {
      console.error('Error loading device data:', err);
      setError('Failed to load device data.');
    }
  };

  const handleReportDownload = async (reportType: 'daily' | 'weekly' | 'monthly' | 'complete') => {
    try {
      switch (reportType) {
        case 'daily':
          await reportService.downloadDailyReport();
          break;
        case 'weekly':
          await reportService.downloadWeeklyReport();
          break;
        case 'monthly':
          await reportService.downloadMonthlyReport();
          break;
        case 'complete':
          await reportService.downloadCompleteReport();
          break;
      }
    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Error logging out:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  const getSensorMetrics = (): SensorMetric[] => {
    if (!latestReading) return [];

    const { sensors } = latestReading;

    return [
      {
        name: 'TEMPERATURE',
        value: sensors.temperature.toFixed(1),
        unit: '°C',
        status: getSensorStatus(sensors.temperature, 22, 32, 20, 35),
        icon: '🌡️',
        trend: calculateTrend('temperature'),
        change: calculateChange('temperature')
      },
      {
        name: 'HUMIDITY',
        value: sensors.humidity.toFixed(0),
        unit: '%',
        status: getSensorStatus(sensors.humidity, 60, 80, 40, 90),
        icon: '💧',
        trend: calculateTrend('humidity'),
        change: calculateChange('humidity')
      },
      {
        name: 'SOIL MOISTURE',
        value: sensors.moisture.toFixed(0),
        unit: '%',
        status: getSensorStatus(sensors.moisture, 50, 70, 25, 75),
        icon: '🌱',
        trend: calculateTrend('moisture'),
        change: calculateChange('moisture')
      },
      {
        name: 'NITROGEN',
        value: sensors.nitrogen.toFixed(0),
        unit: 'mg/kg',
        status: getSensorStatus(sensors.nitrogen, 250, 300, 200, 999),
        icon: '🧪',
        trend: calculateTrend('nitrogen'),
        change: calculateChange('nitrogen')
      },
      {
        name: 'PHOSPHORUS',
        value: sensors.phosphorus.toFixed(0),
        unit: 'mg/kg',
        status: getSensorStatus(sensors.phosphorus, 50, 60, 30, 999),
        icon: '⚗️',
        trend: calculateTrend('phosphorus'),
        change: calculateChange('phosphorus')
      },
      {
        name: 'POTASSIUM',
        value: sensors.potassium.toFixed(0),
        unit: 'mg/kg',
        status: getSensorStatus(sensors.potassium, 200, 250, 150, 999),
        icon: '🔬',
        trend: calculateTrend('potassium'),
        change: calculateChange('potassium')
      }
    ];
  };

  const getSensorStatus = (value: number, optimalMin: number, optimalMax: number, criticalMin: number, criticalMax: number): 'optimal' | 'warning' | 'critical' => {
    if (value < criticalMin || value > criticalMax) return 'critical';
    if (value < optimalMin || value > optimalMax) return 'warning';
    return 'optimal';
  };

  const calculateTrend = (sensorType: string): 'up' | 'down' | undefined => {
    if (historicalData.length < 2) return undefined;

    const recent = historicalData.slice(-2);
    const current = recent[1].sensors[sensorType as keyof typeof recent[1].sensors];
    const previous = recent[0].sensors[sensorType as keyof typeof recent[0].sensors];

    return current > previous ? 'up' : 'down';
  };

  const calculateChange = (sensorType: string): number => {
    if (historicalData.length < 2) return 0;

    const recent = historicalData.slice(-2);
    const current = recent[1].sensors[sensorType as keyof typeof recent[1].sensors];
    const previous = recent[0].sensors[sensorType as keyof typeof recent[0].sensors];

    return ((current - previous) / previous) * 100;
  };

  const getCriticalRecommendations = () => {
    return aiRecommendations.filter(rec => rec.priority === 'critical');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Status Bar */}
      <StatusBar
        user={user}
        selectedDevice={selectedDevice}
        onLogout={handleLogout}
        systemStatus={systemStatus}
      />

      {/* Alert Banner */}
      <CriticalAlertBanner recommendations={getCriticalRecommendations()} />

      {/* Main Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-500">🌱 AgroSense AI Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Areca Crop Monitoring & Treatment System</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select Device</option>
              <option value="areca_node_001">Areca Node 001</option>
              {/* Add more devices as needed */}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleReportDownload('daily')}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                📄 Daily Report
              </button>
              <button
                onClick={() => handleReportDownload('weekly')}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                📊 Weekly Report
              </button>
              <button
                onClick={() => handleReportDownload('monthly')}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                📈 Monthly Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Sensor Metrics Grid */}
        <SensorMetricsGrid metrics={getSensorMetrics()} />

        {/* AI Treatment Panel */}
        <AITreatmentPanel recommendations={aiRecommendations} />

        {/* Analytics Section */}
        <AnalyticsSection
          historicalData={historicalData}
          latestReading={latestReading}
        />

        {/* System Status Panel */}
        <SystemStatusPanel
          systemStatus={systemStatus}
          selectedDevice={selectedDevice}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>AgroSense AI v2.0 | Smart Areca Crop Monitoring</div>
          <div>
            {latestReading && (
              <span>Last Update: {new Date(latestReading.timestamp).toLocaleString()}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;