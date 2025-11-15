# Deployment Guide

## Overview

This guide covers the deployment of the AgroSense AI system, which consists of three main components:
- Frontend (React TypeScript)
- Backend API (Express.js with TypeScript)
- ESP8266 Sensor Nodes
- Firebase Backend Services

## Prerequisites

### Development Environment
- Node.js 18+ and npm
- Git
- Arduino IDE for ESP8266 development
- Firebase project with proper permissions

### Production Environment
- Domain name (optional but recommended)
- SSL certificate (auto-provided by Firebase Hosting)
- Cloud server (for backend API) or Firebase Cloud Functions

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `arecacropmonitoring`
4. Enable Google Analytics (optional)
5. Continue to project setup

### 2. Enable Services
In Firebase Console, enable:

**Authentication**
- Email/Password provider
- Set authorized domains

**Realtime Database**
- Create database in test mode (for development)
- Set up security rules (see `firebase-rules.json`)

**Storage**
- Enable Cloud Storage
- Configure security rules

**Hosting**
- Enable Firebase Hosting
- Connect to your domain (optional)

### 3. Get Configuration
From Firebase Console → Project Settings:

**Web App Config**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "project.firebaseapp.com",
  databaseURL: "https://project-default-rtdb.firebaseio.com",
  projectId: "project-id",
  storageBucket: "project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Service Account**
1. Go to Service Accounts tab
2. Generate new private key
3. Save JSON file securely
4. Use credentials for backend server

## Frontend Deployment

### Option 1: Firebase Hosting (Recommended)

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
```

2. **Initialize Firebase Hosting**
```bash
cd frontend
npm run build
firebase init hosting
```

3. **Configure firebase.json**
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. **Deploy**
```bash
npm run build
firebase deploy
```

### Option 2: Vercel/Netlify

1. Connect repository to Vercel or Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `build`
   - Node version: 18+

### Option 3: Traditional Web Server

1. Build the application:
```bash
cd frontend
npm run build
```

2. Deploy `build` folder to web server
3. Configure server to serve SPA (redirect all routes to index.html)

## Backend Deployment

### Option 1: Firebase Cloud Functions (Recommended)

1. **Setup Cloud Functions**
```bash
mkdir functions
cd functions
npm init -y
npm install firebase-functions firebase-admin express
```

2. **Create functions/index.js**
```javascript
const functions = require('firebase-functions');
const express = require('express');
const { api } = require('./src/api');

const app = express();
app.use('/api', api);

exports.api = functions.https.onRequest(app);
```

3. **Deploy**
```bash
firebase deploy --only functions
```

### Option 2: Traditional Server (VPS/Cloud)

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd areca-crop-monitoring/backend
```

2. **Install Dependencies**
```bash
npm install --production
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Build Application**
```bash
npm run build
```

5. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Setup Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### PM2 Ecosystem Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'agrosense-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## ESP8266 Deployment

### 1. Hardware Setup

**Required Components:**
- ESP8266 NodeMCU or Wemos D1 Mini
- NPK Sensor (RS485) with MAX485 converter
- DHT22 Temperature & Humidity Sensor
- Soil Moisture Sensor (Analog)
- 5V Power supply
- Jumper wires and breadboard

**Wiring Diagram:**
```
ESP8266    →   DHT22
D4 (GPIO2) →   Data Pin
3V3        →   VCC
GND        →   GND

ESP8266    →   Soil Moisture
A0         →   Analog Output
3V3        →   VCC
GND        →   GND

ESP8266    →   MAX485 (NPK Sensor)
D5 (GPIO14)→   RO (Receiver Out)
D6 (GPIO12)→   DI (Driver In)
D2 (GPIO4) →   DE & RE (Driver Enable & Receiver Enable)
5V         →   VCC
GND        →   GND
```

### 2. Software Deployment

1. **Install Arduino IDE**
   - Download from [Arduino.cc](https://www.arduino.cc/en/software)
   - Install ESP8266 board manager

2. **Add ESP8266 Board Manager**
   - File → Preferences → Additional Board Manager URLs:
   - `http://arduino.esp8266.com/stable/package_esp8266com_index.json`

3. **Install ESP8266 Boards**
   - Tools → Board → Boards Manager → Search "ESP8266"
   - Install "esp8266 by ESP8266 Community"

4. **Install Libraries**
   - Tools → Manage Libraries → Install:
     - `Firebase-ESP8266` by Mobizt
     - `DHT sensor library` by Adafruit
     - `ArduinoJson` by Benoit Blanchon
     - `SoftwareSerial` (built-in)

5. **Configure Code**
   - Open `esp8266/sensor_node/sensor_node.ino`
   - Update `config.h` with your WiFi and Firebase credentials
   - Set device ID

6. **Upload Code**
   - Select Board: "NodeMCU 1.0 (ESP-12E Module)"
   - Select correct COM port
   - Upload sketch

### 3. Production Deployment

1. **Power Supply**
   - Use stable 5V power supply
   - Consider battery + solar for field deployment
   - Add power regulation circuit

2. **Enclosure**
   - Weatherproof IP65+ enclosure
   - Ventilation for sensors
   - Mounting hardware

3. **Network Connectivity**
   - Ensure good WiFi coverage
   - Consider external antenna for range
   - Configure static IP if needed

4. **Monitoring**
   - Add LED indicators for status
   - Implement watchdog timer
   - Remote reset capability

## Environment Variables

### Backend (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Firebase Configuration
FIREBASE_PROJECT_ID=arecacropmonitoring
FIREBASE_DATABASE_URL=https://arecacropmonitoring-default-rtdb.firebaseio.com
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Optional: Weather API
WEATHER_API_KEY=your-openweather-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-domain.com/api

# Firebase Configuration (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX

# Application Configuration
REACT_APP_NAME=AgroSense AI
REACT_APP_VERSION=2.0.0
```

## Database Setup

### Firebase Realtime Database Rules

Apply security rules from `firebase-rules.json`:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace existing rules with content from `firebase-rules.json`
3. Publish changes

### Data Structure Initialization

Create initial structure in database:

```json
{
  "sensor_data": {},
  "ai_recommendations": {},
  "user_profiles": {},
  "reports": {},
  "ai_feedback": {}
}
```

## Monitoring and Logging

### Application Monitoring

1. **Firebase Performance Monitoring**
   - Enable in Firebase Console
   - Monitor API response times
   - Track user engagement

2. **Error Tracking**
   - Implement try-catch blocks
   - Log errors to Firebase or external service
   - Set up alerts for critical errors

3. **Health Checks**
   - `/health` endpoint for load balancers
   - Monitor database connectivity
   - Track active devices

### Log Management

1. **Application Logs**
```bash
# PM2 logs
pm2 logs
pm2 logs --lines 100

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

2. **Firebase Extensions**
   - Consider Crashlytics for frontend
   - Use Firebase Performance Monitoring
   - Set up custom alerts

## Security Considerations

### API Security
1. **Authentication**
   - Require Firebase ID tokens
   - Implement proper session management
   - Use HTTPS only

2. **Input Validation**
   - Validate all sensor data
   - Sanitize user inputs
   - Rate limiting per device

3. **Database Security**
   - Proper Firebase rules
   - Data encryption in transit
   - Regular backups

### ESP8266 Security
1. **Network Security**
   - Use WPA2/WPA3 WiFi
   - Regular firmware updates
   - Device authentication

2. **Physical Security**
   - Weatherproof enclosures
   - Tamper detection
   - Secure mounting

## Backup and Recovery

### Firebase Data
1. **Automatic Backups**
   - Enable in Firebase Console
   - Daily automatic backups
   - Point-in-time recovery

2. **Manual Backups**
   - Export data regularly
   - Backup configuration
   - Document recovery procedures

### Application Code
1. **Version Control**
   - Git repository with tags
   - Branch protection
   - Code review process

2. **Deployment Rollback**
   - Keep previous deployments
   - Quick rollback procedures
   - Health verification

## Performance Optimization

### Frontend
1. **Bundle Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization

2. **Caching Strategy**
   - Service worker implementation
   - Browser caching headers
   - CDN usage

### Backend
1. **Database Optimization**
   - Firebase indexes
   - Query optimization
   - Connection pooling

2. **Server Performance**
   - Load balancing
   - Caching layer (Redis)
   - Compression middleware

## Troubleshooting

### Common Issues

1. **ESP8266 Connection Issues**
   - Check WiFi credentials
   - Verify power supply
   - Monitor serial output

2. **Firebase Connection**
   - Verify database rules
   - Check API key validity
   - Review network connectivity

3. **API Errors**
   - Check environment variables
   - Verify authentication tokens
   - Review server logs

### Debug Commands

```bash
# Backend debugging
pm2 monit
pm2 logs api

# ESP8266 debugging
# Open Arduino IDE Serial Monitor at 115200 baud

# Firebase debugging
# Use Firebase Console → Realtime Database → Data tab
```

### Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- ESP8266 Documentation: https://arduino-esp8266.readthedocs.io/
- React Documentation: https://reactjs.org/docs/
- Express.js Documentation: https://expressjs.com/en/guide/

For additional support, contact:
- Email: support@agrosense.ai
- GitHub Issues: [Project Repository](https://github.com/your-repo/issues)