/*
 * Areca Crop Monitoring System - Configuration File
 *
 * Customize these settings for your specific deployment
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Configuration
#define FIREBASE_HOST "arecacropmonitoring-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"

// Device Configuration
#define DEVICE_ID "areca_node_001"
#define FIRMWARE_VERSION "2.0"
#define HARDWARE_VERSION "1.0"

// Sensor Reading Configuration
#define READING_INTERVAL 300000        // 5 minutes in milliseconds
#define WIFI_TIMEOUT 30000             // 30 seconds
#define FIREBASE_TIMEOUT 10000         // 10 seconds
#define MAX_RETRIES 3                  // Maximum retry attempts

// Pin Definitions (NodeMCU)
#define DHT_PIN D4                     // DHT22 sensor
#define DHT_TYPE DHT22                 // DHT22 sensor type
#define SOIL_MOISTURE_PIN A0           // Soil moisture sensor
#define NPK_RX_PIN D6                  // NPK sensor RX
#define NPK_TX_PIN D5                  // NPK sensor TX
#define MAX485_DE_RE_PIN D2            // MAX485 driver enable

// Calibration Values (adjust based on your sensors)
#define SOIL_MOISTURE_DRY 850          // Analog value for dry soil
#define SOIL_MOISTURE_WET 300          // Analog value for wet soil

// Sensor Validation Ranges
#define TEMP_MIN -10.0                 // Minimum valid temperature (°C)
#define TEMP_MAX 60.0                  // Maximum valid temperature (°C)
#define HUMIDITY_MIN 0.0               // Minimum valid humidity (%)
#define HUMIDITY_MAX 100.0             // Maximum valid humidity (%)
#define MOISTURE_MIN 0.0               // Minimum valid soil moisture (%)
#define MOISTURE_MAX 100.0             // Maximum valid soil moisture (%)
#define NITROGEN_MIN 0.0               // Minimum valid nitrogen (mg/kg)
#define NITROGEN_MAX 500.0             // Maximum valid nitrogen (mg/kg)
#define PHOSPHORUS_MIN 0.0             // Minimum valid phosphorus (mg/kg)
#define PHOSPHORUS_MAX 200.0           // Maximum valid phosphorus (mg/kg)
#define POTASSIUM_MIN 0.0              // Minimum valid potassium (mg/kg)
#define POTASSIUM_MAX 500.0            // Maximum valid potassium (mg/kg)

// Power Management
#define ENABLE_DEEP_SLEEP false        // Enable deep sleep mode
#define DEEP_SLEEP_DURATION 300        // Deep sleep duration (seconds)

// Debug Configuration
#define DEBUG_ENABLED true             // Enable debug output
#define SERIAL_BAUD_RATE 115200        // Serial communication speed

// Feature Flags
#define ENABLE_BATTERY_MONITORING false // Enable battery monitoring
#define ENABLE_OTA_UPDATES false        // Enable over-the-air updates
#define ENABLE_NTP_TIME true            // Enable NTP time sync

// NTP Configuration (if enabled)
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 19800           // GMT+5:30 for India
#define DAYLIGHT_OFFSET_SEC 0          // No daylight saving

#endif // CONFIG_H