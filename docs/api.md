# AgroSense AI API Documentation

## Overview

The AgroSense AI API provides endpoints for sensor data ingestion, AI processing, user authentication, and report generation. The API is built with Express.js and TypeScript, using Firebase for authentication and data storage.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require Firebase ID token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "securepassword",
  "farmName": "Green Areca Plantation",
  "location": "Karnataka, India"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "uid": "user123",
    "email": "farmer@example.com",
    "displayName": "Green Areca Plantation",
    "customToken": "firebase_custom_token"
  }
}
```

#### POST /api/auth/login
Authenticate user and get custom token.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "user123",
    "email": "farmer@example.com",
    "displayName": "Green Areca Plantation",
    "customToken": "firebase_custom_token"
  }
}
```

#### GET /api/auth/profile
Get user profile information.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "email": "farmer@example.com",
    "farm_name": "Green Areca Plantation",
    "location": "Karnataka, India",
    "devices": ["areca_node_001"],
    "settings": { ... }
  }
}
```

### Sensor Data

#### POST /api/data/ingest
**No authentication required** - For ESP8266 sensor nodes.

Submit sensor data from ESP8266 device.

**Request Body:**
```json
{
  "deviceId": "areca_node_001",
  "temperature": 28.5,
  "humidity": 72,
  "moisture": 42,
  "N": 280,
  "P": 45,
  "K": 220
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sensor data received and stored successfully",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### GET /api/data/sensor
Get sensor data for authenticated user.

**Query Parameters:**
- `deviceId` (optional): Specific device ID

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "areca_node_001": {
      "1642248600000": {
        "timestamp": "2025-01-15T10:30:00.000Z",
        "sensors": { ... },
        "system": { ... },
        "ai_processed": true
      }
    }
  }
}
```

#### GET /api/data/recommendations
Get AI recommendations for devices.

**Query Parameters:**
- `deviceId` (optional): Specific device ID
- `limit` (optional): Maximum number of recommendations (default: 10)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "areca_node_001": {
      "1642248600000": {
        "deviceId": "areca_node_001",
        "timestamp": "2025-01-15T10:30:00.000Z",
        "recommendations": [ ... ],
        "priority": "HIGH",
        "cost_estimate": 125.50
      }
    }
  }
}
```

#### POST /api/ai/process-sensor-data
Manually process sensor data with AI engine.

**Request Body:**
```json
{
  "deviceId": "areca_node_001",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "sensorData": {
    "temperature": 28.5,
    "humidity": 72,
    "moisture": 42,
    "nitrogen": 280,
    "phosphorus": 45,
    "potassium": 220,
    "data_transfer_quality": "excellent"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI processing completed successfully",
  "data": {
    "recommendations": [ ... ],
    "priority": "HIGH",
    "costEstimate": 125.50
  }
}
```

#### GET /api/data/historical
Get historical sensor data for analysis.

**Query Parameters:**
- `startDate` (required): Start date (ISO format)
- `endDate` (required): End date (ISO format)
- `deviceId` (optional): Specific device ID

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "areca_node_001": {
      "1642248600000": { ... },
      "1642248660000": { ... }
    }
  },
  "metadata": {
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-01-15T23:59:59.999Z",
    "deviceCount": 1,
    "totalReadings": 288
  }
}
```

#### POST /api/ai/feedback
Submit feedback on AI recommendations.

**Request Body:**
```json
{
  "deviceId": "areca_node_001",
  "recommendationId": "rec_123",
  "feedback": {
    "applied": true,
    "effectiveness": 4,
    "notes": "Treatment worked well, soil moisture improved significantly"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

#### GET /api/system/status
Get system status and device information.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user123",
      "email": "farmer@example.com",
      "farmName": "Green Areca Plantation",
      "location": "Karnataka, India"
    },
    "devices": {
      "total": 3,
      "online": 2,
      "offline": 1,
      "status": {
        "areca_node_001": "online",
        "areca_node_002": "offline",
        "areca_node_003": "online"
      }
    },
    "system": {
      "lastUpdate": "2025-01-15T10:35:00.000Z",
      "recentRecommendations": 5,
      "healthStatus": "moderate"
    }
  }
}
```

### Reports

#### GET /api/reports/daily
Generate daily PDF report.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:** PDF file download with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="areca-daily-report-2025-01-15.pdf"
```

#### GET /api/reports/weekly
Generate weekly PDF report.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:** PDF file download

#### GET /api/reports/monthly
Generate monthly PDF report.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:** PDF file download

#### GET /api/reports/all
Generate complete report with all data.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:** PDF file download

#### GET /api/reports/list
Get list of available reports.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": {
      "2025-01-15": {
        "url": "https://storage.googleapis.com/...",
        "filename": "areca-daily-report-2025-01-15.pdf",
        "generatedAt": "2025-01-15T10:00:00.000Z",
        "size": 1048576
      }
    },
    "weekly": { ... },
    "monthly": { ... }
  }
}
```

#### DELETE /api/reports/:reportType/:dateKey
Delete a specific report.

**Path Parameters:**
- `reportType`: daily, weekly, monthly, or complete
- `dateKey`: Date identifier (YYYY-MM-DD, YYYY-WXX, YYYY-MM)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "stack": "Error stack trace (development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Sensor data ingestion: 60 requests per minute per device
- Report generation: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user

## Sensor Data Schema

### Expected Sensor Reading Format

```json
{
  "deviceId": "areca_node_001",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "sensors": {
    "temperature": 28.5,      // Celsius, -50 to 100
    "humidity": 72,           // Percentage, 0 to 100
    "moisture": 42,           // Percentage, 0 to 100
    "nitrogen": 280,          // mg/kg, 0 to 500
    "phosphorus": 45,         // mg/kg, 0 to 200
    "potassium": 220,         // mg/kg, 0 to 500
    "data_transfer_quality": "excellent" | "good" | "poor"
  },
  "system": {
    "battery": 85,            // Percentage, 0 to 100
    "signal": -45,            // dBm, -120 to 0
    "uptime": 12345           // Seconds, >= 0
  },
  "ai_processed": false      // Boolean
}
```

## AI Recommendation Schema

```json
{
  "type": "watering" | "fertilizer" | "environmental" | "pesticide" | "harvest",
  "priority": "critical" | "high" | "medium" | "low",
  "action": "Add water immediately",
  "quantity": "400-500ml",
  "frequency": "Every 8 hours until optimal",
  "reasoning": "Critical moisture level detected",
  "confidence": 95,          // 0 to 100
  "costEstimate": 0.80       // Local currency
}
```

## WebSocket Support (Future Enhancement)

Real-time updates via WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time sensor updates
};
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`
  }
});

// Get sensor data
const sensorData = await api.get('/data/sensor');

// Process with AI
const recommendations = await api.post('/ai/process-sensor-data', {
  deviceId: 'areca_node_001',
  sensorData: { ... }
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {firebase_token}',
    'Content-Type': 'application/json'
}

# Get sensor data
response = requests.get(
    'http://localhost:5000/api/data/sensor',
    headers=headers
)
data = response.json()
```

## Testing

Use the provided test endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Test sensor data ingestion
curl -X POST http://localhost:5000/api/data/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device",
    "temperature": 25.5,
    "humidity": 70,
    "moisture": 55,
    "N": 260,
    "P": 50,
    "K": 210
  }'
```

## Support

For API support and questions:
- Documentation: [API Docs](./api.md)
- GitHub Issues: [Project Issues](https://github.com/your-repo/issues)
- Email: support@agrosense.ai