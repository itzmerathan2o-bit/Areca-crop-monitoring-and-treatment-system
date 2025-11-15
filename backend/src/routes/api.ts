import express from 'express';
import admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery, sensorDataSchema, espSensorDataSchema, dateRangeSchema, aiFeedbackSchema } from '../middleware/validation';
import { arecaAIEngine } from '../services/arecaAIEngine';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// ESP8266 sensor data ingestion endpoint (no auth required for sensor nodes)
router.post('/data/ingest', validateBody(espSensorDataSchema), asyncHandler(async (req, res) => {
  const { deviceId, temperature, humidity, moisture, N, P, K } = req.body;

  try {
    // Create sensor reading object
    const reading = {
      timestamp: new Date().toISOString(),
      sensors: {
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        moisture: parseFloat(moisture),
        nitrogen: parseFloat(N),
        phosphorus: parseFloat(P),
        potassium: parseFloat(K),
        data_transfer_quality: 'excellent'
      },
      system: {
        battery: 100, // Default - could be sent by ESP8266
        signal: -45,  // Default - could be sent by ESP8266
        uptime: 0     // Default - could be sent by ESP8266
      },
      ai_processed: false
    };

    // Store in Firebase Realtime Database
    const db = admin.database();
    await db.ref(`sensor_data/${deviceId}/${Date.now()}`).set(reading);

    // Process with AI engine (async, don't wait for completion)
    processWithAI(deviceId, reading).catch(error => {
      console.error('AI processing error:', error);
    });

    res.status(200).json({
      success: true,
      message: 'Sensor data received and stored successfully',
      timestamp: reading.timestamp
    });

  } catch (error) {
    console.error('Error processing sensor data:', error);
    throw new AppError('Failed to process sensor data', 500);
  }
}));

// Process sensor data with AI
async function processWithAI(deviceId: string, reading: any) {
  try {
    // Convert to format expected by AI engine
    const sensorReading = {
      sensor_id: deviceId,
      esp32_id: deviceId,
      field_id: 'default_field',
      timestamp: reading.timestamp,
      signal_strength: reading.system.signal || 80,
      battery_level: reading.system.battery || 100,
      sensors: reading.sensors,
      location: {
        latitude: 0, // Default - could be configured
        longitude: 0
      },
      alerts: []
    };

    // Get AI recommendations
    const recommendations = await arecaAIEngine.processSensorData(sensorReading);

    // Store AI recommendations
    const db = admin.database();
    const aiData = {
      deviceId,
      timestamp: reading.timestamp,
      recommendations,
      priority: recommendations.length > 0 ?
        (recommendations[0].priority === 'critical' ? 'HIGH' :
         recommendations[0].priority === 'high' ? 'MEDIUM' : 'LOW') : 'LOW',
      cost_estimate: recommendations.reduce((sum, rec) => sum + (rec.costEstimate || 0), 0),
      processed_at: new Date().toISOString()
    };

    await db.ref(`ai_recommendations/${deviceId}/${Date.now()}`).set(aiData);

    // Mark sensor data as processed
    await db.ref(`sensor_data/${deviceId}/${Date.now()}/ai_processed`).set(true);

    console.log(`AI processing completed for device ${deviceId}: ${recommendations.length} recommendations generated`);

  } catch (error) {
    console.error(`AI processing failed for device ${deviceId}:`, error);
    throw error;
  }
}

// Get sensor data for authenticated user
router.get('/data/sensor', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { deviceId } = req.query;
  const userId = req.user!.uid;

  try {
    const db = admin.database();
    let sensorRef: any;

    if (deviceId) {
      sensorRef = db.ref(`sensor_data/${deviceId}`);
    } else {
      // Get all sensor data for user's devices
      const userRef = db.ref(`user_profiles/${userId}/devices`);
      const userSnapshot = await userRef.get();
      const userDevices = userSnapshot.val() || [];

      // Get data for all user devices (limited to last 100 readings each)
      const promises = userDevices.map(async (device: string) => {
        const deviceRef = db.ref(`sensor_data/${device}`).limitToLast(100);
        const snapshot = await deviceRef.get();
        return snapshot.exists() ? { [device]: snapshot.val() } : null;
      });

      const results = await Promise.all(promises);
      const allData = results.filter(Boolean).reduce((acc, data) => ({ ...acc, ...data }), {});

      return res.status(200).json({
        success: true,
        data: allData
      });
    }

    const snapshot = await sensorRef.limitToLast(100).get();

    if (!snapshot.exists()) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    res.status(200).json({
      success: true,
      data: {
        [deviceId]: snapshot.val()
      }
    });

  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw new AppError('Failed to fetch sensor data', 500);
  }
}));

// Get AI recommendations
router.get('/data/recommendations', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { deviceId, limit = 10 } = req.query;
  const userId = req.user!.uid;

  try {
    const db = admin.database();
    let recRef: any;

    if (deviceId) {
      recRef = db.ref(`ai_recommendations/${deviceId}`).limitToLast(parseInt(limit as string));
    } else {
      // Get recommendations for all user devices
      const userRef = db.ref(`user_profiles/${userId}/devices`);
      const userSnapshot = await userRef.get();
      const userDevices = userSnapshot.val() || [];

      const promises = userDevices.map(async (device: string) => {
        const deviceRef = db.ref(`ai_recommendations/${device}`).limitToLast(parseInt(limit as string));
        const snapshot = await deviceRef.get();
        return snapshot.exists() ? { [device]: snapshot.val() } : null;
      });

      const results = await Promise.all(promises);
      const allData = results.filter(Boolean).reduce((acc, data) => ({ ...acc, ...data }), {});

      return res.status(200).json({
        success: true,
        data: allData
      });
    }

    const snapshot = await recRef.get();

    if (!snapshot.exists()) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    res.status(200).json({
      success: true,
      data: {
        [deviceId]: snapshot.val()
      }
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw new AppError('Failed to fetch recommendations', 500);
  }
}));

// Process sensor data manually (for testing/manual processing)
router.post('/ai/process-sensor-data', validateBody(sensorDataSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { deviceId, timestamp, sensorData } = req.body;

  try {
    // Convert to format expected by AI engine
    const sensorReading = {
      sensor_id: deviceId,
      esp32_id: deviceId,
      field_id: 'default_field',
      timestamp,
      signal_strength: 80,
      battery_level: 100,
      sensors: sensorData,
      location: {
        latitude: 0,
        longitude: 0
      },
      alerts: []
    };

    // Get AI recommendations
    const recommendations = await arecaAIEngine.processSensorData(sensorReading);

    // Store AI recommendations
    const db = admin.database();
    const aiData = {
      deviceId,
      timestamp,
      recommendations,
      priority: recommendations.length > 0 ?
        (recommendations[0].priority === 'critical' ? 'HIGH' :
         recommendations[0].priority === 'high' ? 'MEDIUM' : 'LOW') : 'LOW',
      cost_estimate: recommendations.reduce((sum, rec) => sum + (rec.costEstimate || 0), 0),
      processed_at: new Date().toISOString()
    };

    await db.ref(`ai_recommendations/${deviceId}/${Date.now()}`).set(aiData);

    res.status(200).json({
      success: true,
      message: 'AI processing completed successfully',
      data: {
        recommendations,
        priority: aiData.priority,
        costEstimate: aiData.cost_estimate
      }
    });

  } catch (error) {
    console.error('Error processing sensor data with AI:', error);
    throw new AppError('Failed to process sensor data with AI', 500);
  }
}));

// Submit treatment feedback
router.post('/ai/feedback', validateBody(aiFeedbackSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { deviceId, recommendationId, feedback } = req.body;
  const userId = req.user!.uid;

  try {
    const db = admin.database();

    // Store feedback
    const feedbackData = {
      userId,
      deviceId,
      recommendationId,
      feedback,
      submitted_at: admin.database.ServerValue.TIMESTAMP
    };

    await db.ref(`ai_feedback/${deviceId}/${Date.now()}`).set(feedbackData);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new AppError('Failed to submit feedback', 500);
  }
}));

// Get historical data
router.get('/data/historical', validateQuery(dateRangeSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, deviceId } = req.query;
  const userId = req.user!.uid;

  try {
    const db = admin.database();
    const start = new Date(startDate as string).getTime();
    const end = new Date(endDate as string).getTime();

    let data: any = {};

    if (deviceId) {
      // Get data for specific device
      const deviceRef = db.ref(`sensor_data/${deviceId}`);
      const snapshot = await deviceRef.get();

      if (snapshot.exists()) {
        const allData = snapshot.val();
        const filteredData = Object.entries(allData)
          .filter(([timestamp, _]: [string, any]) => {
            const time = parseInt(timestamp);
            return time >= start && time <= end;
          })
          .reduce((acc, [timestamp, reading]: [string, any]) => {
            acc[timestamp] = reading;
            return acc;
          }, {});

        data[deviceId] = filteredData;
      }
    } else {
      // Get data for all user devices
      const userRef = db.ref(`user_profiles/${userId}/devices`);
      const userSnapshot = await userRef.get();
      const userDevices = userSnapshot.val() || [];

      for (const device of userDevices) {
        const deviceRef = db.ref(`sensor_data/${device}`);
        const snapshot = await deviceRef.get();

        if (snapshot.exists()) {
          const allData = snapshot.val();
          const filteredData = Object.entries(allData)
            .filter(([timestamp, _]: [string, any]) => {
              const time = parseInt(timestamp);
              return time >= start && time <= end;
            })
            .reduce((acc, [timestamp, reading]: [string, any]) => {
              acc[timestamp] = reading;
              return acc;
            }, {});

          if (Object.keys(filteredData).length > 0) {
            data[device] = filteredData;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data,
      metadata: {
        startDate,
        endDate,
        deviceCount: Object.keys(data).length,
        totalReadings: Object.values(data).reduce((sum: number, deviceData: any) =>
          sum + Object.keys(deviceData).length, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new AppError('Failed to fetch historical data', 500);
  }
}));

// Get system status
router.get('/system/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.uid;

  try {
    const db = admin.database();

    // Get user profile
    const userRef = db.ref(`user_profiles/${userId}`);
    const userSnapshot = await userRef.get();
    const userProfile = userSnapshot.val() || {};

    // Get user devices
    const devices = userProfile.devices || [];
    const totalDevices = devices.length;

    // Check device status (last reading time)
    let onlineDevices = 0;
    const deviceStatus: any = {};

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    for (const deviceId of devices) {
      const deviceRef = db.ref(`sensor_data/${deviceId}`).limitToLast(1);
      const snapshot = await deviceRef.get();

      if (snapshot.exists()) {
        const data = snapshot.val();
        const lastTimestamp = parseInt(Object.keys(data)[0]);

        if (lastTimestamp > fiveMinutesAgo) {
          onlineDevices++;
          deviceStatus[deviceId] = 'online';
        } else {
          deviceStatus[deviceId] = 'offline';
        }
      } else {
        deviceStatus[deviceId] = 'no_data';
      }
    }

    // Get recent AI recommendations count
    let recentRecommendations = 0;
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const deviceId of devices) {
      const recRef = db.ref(`ai_recommendations/${deviceId}`).orderByKey().startAt(twentyFourHoursAgo.toString());
      const snapshot = await recRef.get();
      if (snapshot.exists()) {
        recentRecommendations += Object.keys(snapshot.val()).length;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          userId,
          email: userProfile.email,
          farmName: userProfile.farm_name,
          location: userProfile.location
        },
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: totalDevices - onlineDevices,
          status: deviceStatus
        },
        system: {
          lastUpdate: new Date().toISOString(),
          recentRecommendations,
          healthStatus: onlineDevices === totalDevices ? 'healthy' :
                       onlineDevices > 0 ? 'moderate' : 'critical'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching system status:', error);
    throw new AppError('Failed to fetch system status', 500);
  }
}));

export default router;