import { ref, onValue, push, update, get } from 'firebase/database';
import { database } from '../config/firebase';
import { SensorReading, AIProcessedData, UserProfile } from '../types/sensors';

export class FirebaseService {
  private db = database;

  // Sensor Data Operations
  subscribeToSensorData(deviceId: string, callback: (data: SensorReading | null) => void) {
    const sensorRef = ref(this.db, `sensor_data/${deviceId}`);

    return onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get the latest reading (most recent timestamp)
        const timestamps = Object.keys(data);
        const latestTimestamp = timestamps.sort().pop();
        if (latestTimestamp) {
          callback({
            deviceId,
            timestamp: latestTimestamp,
            ...data[latestTimestamp]
          });
        }
      } else {
        callback(null);
      }
    });
  }

  subscribeToAIRecommendations(deviceId: string, callback: (data: AIProcessedData[] | null) => void) {
    const aiRef = ref(this.db, `ai_recommendations/${deviceId}`);

    return onValue(aiRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recommendations = Object.entries(data).map(([timestamp, recData]: [string, any]) => ({
          deviceId,
          timestamp,
          ...recData
        }));
        callback(recommendations);
      } else {
        callback(null);
      }
    });
  }

  // User Profile Operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = ref(this.db, `user_profiles/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.val() ? { userId, ...snapshot.val() } : null;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = ref(this.db, `user_profiles/${userId}`);
    await update(userRef, updates);
  }

  async createUserProfile(userId: string, profile: Omit<UserProfile, 'userId'>): Promise<void> {
    const userRef = ref(this.db, `user_profiles/${userId}`);
    await update(userRef, profile);
  }

  // Historical Data Operations
  async getHistoricalData(deviceId: string, startDate: Date, endDate: Date): Promise<SensorReading[]> {
    const sensorRef = ref(this.db, `sensor_data/${deviceId}`);
    const snapshot = await get(sensorRef);
    const data = snapshot.val();

    if (!data) return [];

    const readings: SensorReading[] = [];
    const start = startDate.getTime();
    const end = endDate.getTime();

    Object.entries(data).forEach(([timestamp, readingData]: [string, any]) => {
      const readingTime = new Date(timestamp).getTime();
      if (readingTime >= start && readingTime <= end) {
        readings.push({
          deviceId,
          timestamp,
          ...readingData
        });
      }
    });

    return readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Report Operations
  async saveReportUrl(userId: string, reportType: string, dateKey: string, url: string): Promise<void> {
    const reportRef = ref(this.db, `reports/${userId}/${reportType}/${dateKey}`);
    await update(reportRef, { url, generatedAt: new Date().toISOString() });
  }

  async getReportUrls(userId: string, reportType: string): Promise<Record<string, string>> {
    const reportRef = ref(this.db, `reports/${userId}/${reportType}`);
    const snapshot = await get(reportRef);
    const data = snapshot.val();

    if (!data) return {};

    const urls: Record<string, string> = {};
    Object.entries(data).forEach(([dateKey, reportData]: [string, any]) => {
      urls[dateKey] = reportData.url;
    });

    return urls;
  }

  // Device Management
  async addDeviceToUser(userId: string, deviceId: string): Promise<void> {
    const userRef = ref(this.db, `user_profiles/${userId}/devices`);
    const snapshot = await get(userRef);
    const devices = snapshot.val() || [];

    if (!devices.includes(deviceId)) {
      devices.push(deviceId);
      await update(userRef, devices);
    }
  }

  async removeDeviceFromUser(userId: string, deviceId: string): Promise<void> {
    const userRef = ref(this.db, `user_profiles/${userId}/devices`);
    const snapshot = await get(userRef);
    const devices = snapshot.val() || [];

    const updatedDevices = devices.filter((id: string) => id !== deviceId);
    await update(userRef, updatedDevices);
  }
}

export const firebaseService = new FirebaseService();