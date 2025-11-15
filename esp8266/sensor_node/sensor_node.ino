/*
 * Areca Crop Monitoring System - ESP8266 Sensor Node
 *
 * This code reads sensor data from NPK, temperature, humidity, and soil moisture sensors
 * and sends the data to Firebase Realtime Database for processing by the AI engine.
 *
 * Hardware Requirements:
 * - ESP8266 (NodeMCU or Wemos D1 Mini)
 * - NPK Sensor (RS485) + MAX485 converter
 * - DHT22 Temperature & Humidity Sensor
 * - Soil Moisture Sensor (Analog)
 * - 5V Power supply
 *
 * Author: AgroSense AI Team
 * Version: 2.0
 */

#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <SoftwareSerial.h>

// WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Configuration
#define FIREBASE_HOST "arecacropmonitoring-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET" // Database secret from Firebase Console

// Device Configuration
#define DEVICE_ID "areca_node_001"
#define READING_INTERVAL 300000 // 5 minutes in milliseconds

// Pin Definitions
#define DHT_PIN D4
#define DHT_TYPE DHT22
#define SOIL_MOISTURE_PIN A0
#define NPK_RX_PIN D6
#define NPK_TX_PIN D5
#define MAX485_DE_RE_PIN D2

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
SoftwareSerial npkSerial(NPK_RX_PIN, NPK_TX_PIN);
FirebaseData firebaseData;
FirebaseJson json;

// Global Variables
unsigned long lastReadingTime = 0;
bool wifiConnected = false;
int retryCount = 0;
const int MAX_RETRIES = 3;

// NPK Sensor Variables
float nitrogen = 0;
float phosphorus = 0;
float potassium = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("🌱 Areca Crop Monitoring System v2.0");
  Serial.println("=====================================");

  // Initialize pins
  pinMode(MAX485_DE_RE_PIN, OUTPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  digitalWrite(MAX485_DE_RE_PIN, LOW); // Put MAX485 in receive mode

  // Initialize sensors
  initializeSensors();

  // Connect to WiFi
  connectWiFi();

  // Initialize Firebase
  initializeFirebase();

  Serial.println("✅ System initialization complete");
  Serial.println("🔄 Starting sensor readings...");
}

void loop() {
  unsigned long currentTime = millis();

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("❌ WiFi connection lost");
    connectWiFi();
  }

  // Take sensor readings at specified interval
  if (currentTime - lastReadingTime >= READING_INTERVAL || lastReadingTime == 0) {
    if (wifiConnected) {
      readAndSendSensorData();
      lastReadingTime = currentTime;
    } else {
      Serial.println("⏳ Waiting for WiFi connection...");
    }
  }

  // Handle Firebase reconnection
  if (!Firebase.ready() && wifiConnected) {
    Serial.println("🔄 Reconnecting to Firebase...");
    initializeFirebase();
  }

  delay(1000); // Small delay to prevent excessive looping
}

void initializeSensors() {
  Serial.println("🔧 Initializing sensors...");

  // Initialize DHT22
  dht.begin();
  Serial.println("✅ DHT22 sensor initialized");

  // Initialize SoftwareSerial for NPK sensor
  npkSerial.begin(9600);
  Serial.println("✅ NPK sensor serial initialized");

  delay(1000);
}

void connectWiFi() {
  if (wifiConnected) return;

  Serial.println("📡 Connecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("✅ WiFi connected successfully!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📡 Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println();
    Serial.println("❌ Failed to connect to WiFi");
    Serial.println("🔄 Will retry in next cycle...");
  }
}

void initializeFirebase() {
  Serial.println("🔥 Initializing Firebase...");

  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Set database rules timeout
  firebaseData.setBSSLBufferSize(1024, 1024);
  firebaseData.setResponseSize(1024);

  if (Firebase.ready()) {
    Serial.println("✅ Firebase connected successfully!");
  } else {
    Serial.println("❌ Firebase connection failed");
    Serial.print("Error: ");
    Serial.println(firebaseData.errorReason());
  }
}

void readAndSendSensorData() {
  Serial.println("\n📊 Reading sensor data...");

  // Read all sensors
  float temperature = readTemperature();
  float humidity = readHumidity();
  float moisture = readSoilMoisture();
  readNPKSensor();

  // Validate sensor readings
  if (validateSensorReadings(temperature, humidity, moisture, nitrogen, phosphorus, potassium)) {
    // Create JSON payload
    createAndSendData(temperature, humidity, moisture, nitrogen, phosphorus, potassium);
  } else {
    Serial.println("❌ Invalid sensor readings, skipping transmission");
  }
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("⚠️ Failed to read temperature from DHT22");
    return -999; // Error value
  }
  Serial.print("🌡️ Temperature: ");
  Serial.print(temp);
  Serial.println("°C");
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    Serial.println("⚠️ Failed to read humidity from DHT22");
    return -999; // Error value
  }
  Serial.print("💧 Humidity: ");
  Serial.print(hum);
  Serial.println("%");
  return hum;
}

float readSoilMoisture() {
  int rawValue = analogRead(SOIL_MOISTURE_PIN);

  // Convert analog reading to percentage (calibrate based on your sensor)
  // This is a basic calibration - you may need to adjust min/max values
  int dryValue = 850;  // Value when sensor is in dry air
  int wetValue = 300;  // Value when sensor is in water

  float moisture = map(rawValue, dryValue, wetValue, 0, 100);
  moisture = constrain(moisture, 0, 100);

  Serial.print("🌱 Soil Moisture: ");
  Serial.print(moisture);
  Serial.println("% (Raw: ");
  Serial.print(rawValue);
  Serial.println(")");

  return moisture;
}

void readNPKSensor() {
  Serial.println("🧪 Reading NPK sensor...");

  // Set MAX485 to transmit mode
  digitalWrite(MAX485_DE_RE_PIN, HIGH);
  delay(10);

  // Send command to read NPK values
  npkSerial.write((uint8_t*)"\x01\x03\x00\x1E\x00\x03\x65\xCD", 8);
  npkSerial.flush();
  delay(10);

  // Set MAX485 to receive mode
  digitalWrite(MAX485_DE_RE_PIN, LOW);
  delay(10);

  // Read response
  byte npkResponse[9];
  int bytesReceived = 0;

  // Wait for response with timeout
  unsigned long timeout = millis() + 1000;
  while (bytesReceived < 9 && millis() < timeout) {
    if (npkSerial.available()) {
      npkResponse[bytesReceived] = npkSerial.read();
      bytesReceived++;
    }
  }

  if (bytesReceived == 9) {
    // Parse NPK values from response
    nitrogen = parseNPKValue(npkResponse, 3);
    phosphorus = parseNPKValue(npkResponse, 5);
    potassium = parseNPKValue(npkResponse, 7);

    Serial.print("🧪 NPK Values - N: ");
    Serial.print(nitrogen);
    Serial.print(" mg/kg, P: ");
    Serial.print(phosphorus);
    Serial.print(" mg/kg, K: ");
    Serial.print(potassium);
    Serial.println(" mg/kg");
  } else {
    Serial.println("⚠️ Failed to read NPK sensor");
    // Use default/last known values
    nitrogen = 250;
    phosphorus = 50;
    potassium = 200;
  }
}

float parseNPKValue(byte* response, int startIndex) {
  // Combine two bytes to get the value
  int value = (response[startIndex] << 8) | response[startIndex + 1];
  return (float)value;
}

bool validateSensorReadings(float temp, float hum, float moisture, float N, float P, float K) {
  // Define valid ranges for sensor readings
  bool tempValid = (temp >= -10 && temp <= 60);
  bool humValid = (hum >= 0 && hum <= 100);
  bool moistureValid = (moisture >= 0 && moisture <= 100);
  bool npkValid = (N >= 0 && N <= 500 && P >= 0 && P <= 200 && K >= 0 && K <= 500);

  Serial.print("🔍 Validation - Temp: ");
  Serial.print(tempValid ? "✅" : "❌");
  Serial.print(", Hum: ");
  Serial.print(humValid ? "✅" : "❌");
  Serial.print(", Moisture: ");
  Serial.print(moistureValid ? "✅" : "❌");
  Serial.print(", NPK: ");
  Serial.println(npkValid ? "✅" : "❌");

  return tempValid && humValid && moistureValid && npkValid;
}

void createAndSendData(float temp, float hum, float moisture, float N, float P, float K) {
  Serial.println("📤 Creating data payload...");

  // Create JSON document
  StaticJsonDocument<512> doc;

  // Add device information
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = round(temp * 10) / 10; // Round to 1 decimal place
  doc["humidity"] = round(hum);
  doc["moisture"] = round(moisture);
  doc["N"] = round(N);
  doc["P"] = round(P);
  doc["K"] = round(K);

  // Add system information
  doc["system"]["battery"] = 100; // TODO: Implement battery reading if available
  doc["system"]["signal"] = WiFi.RSSI();
  doc["system"]["uptime"] = millis() / 1000;
  doc["system"]["freeHeap"] = ESP.getFreeHeap();

  // Add timestamp
  doc["timestamp"] = getFormattedTimestamp();

  // Serialize JSON to string
  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("📤 Data payload: ");
  Serial.println(jsonString);

  // Send to Firebase
  sendToFirebase(jsonString);
}

void sendToFirebase(String jsonString) {
  Serial.println("🔥 Sending data to Firebase...");

  String path = "sensor_data/" + String(DEVICE_ID) + "/" + String(millis());

  retryCount = 0;
  bool success = false;

  while (retryCount < MAX_RETRIES && !success) {
    if (Firebase.setJSON(firebaseData, path.c_str(), jsonString)) {
      success = true;
      Serial.println("✅ Data sent to Firebase successfully!");

      // Log transmission details
      Serial.print("📊 Path: ");
      Serial.println(path);
      Serial.print("📡 Signal: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      Serial.print("💾 Free Heap: ");
      Serial.print(ESP.getFreeHeap());
      Serial.println(" bytes");

    } else {
      retryCount++;
      Serial.print("❌ Firebase upload failed (attempt ");
      Serial.print(retryCount);
      Serial.print("/");
      Serial.print(MAX_RETRIES);
      Serial.print("): ");
      Serial.println(firebaseData.errorReason());

      if (retryCount < MAX_RETRIES) {
        Serial.println("🔄 Retrying in 5 seconds...");
        delay(5000);
      }
    }
  }

  if (!success) {
    Serial.println("❌ Failed to send data after maximum retries");
    Serial.println("🔄 Will retry in next cycle");
  }
}

String getFormattedTimestamp() {
  // Get current time (TODO: Implement NTP time sync for accurate timestamps)
  unsigned long currentTime = millis();

  // For now, use uptime-based timestamp
  // In production, implement NTP for real timestamps
  return "2025-01-15T" + String(currentTime);
}

void printSystemInfo() {
  Serial.println("\n📋 System Information:");
  Serial.print("🔧 Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("📡 WiFi Status: ");
  Serial.println(wifiConnected ? "Connected" : "Disconnected");
  Serial.print("🔥 Firebase Status: ");
  Serial.println(Firebase.ready() ? "Connected" : "Disconnected");
  Serial.print("💾 Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.print("⏱️ Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  Serial.print("📡 Signal Strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.println("=====================================\n");
}

// Optional: Deep sleep mode for power saving
// Uncomment and configure if you want to use deep sleep
/*
void enterDeepSleep() {
  Serial.println("😴 Entering deep sleep mode...");
  Serial.print("⏰ Will wake up in ");
  Serial.print(READING_INTERVAL / 1000);
  Serial.println(" seconds");

  // Configure wake up time
  ESP.deepSleep(READING_INTERVAL * 1000);
}
*/