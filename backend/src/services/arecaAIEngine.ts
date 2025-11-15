import { SensorReading, AIRecommendation } from '../types/sensors';

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  windSpeed: number;
}

interface GrowthStage {
  stage: 'seedling' | 'juvenile' | 'mature' | 'harvest';
  ageMonths: number;
  expectedYield: number;
}

export class ArecaAIEngine {
  private historicalData: SensorReading[] = [];
  private treatmentHistory: any[] = [];

  // Areca-specific optimal ranges
  private readonly OPTIMAL_RANGES = {
    temperature: { min: 22, max: 32 },
    humidity: { min: 60, max: 80 },
    moisture: { min: 50, max: 70 },
    nitrogen: { min: 250, max: 300 },
    phosphorus: { min: 50, max: 60 },
    potassium: { min: 200, max: 250 }
  };

  // Critical thresholds
  private readonly CRITICAL_THRESHOLDS = {
    temperature: { min: 20, max: 35 },
    humidity: { min: 40, max: 90 },
    moisture: { critical: 25, warning: 50, high: 75 },
    nitrogen: { critical: 200, warning: 250 },
    phosphorus: { critical: 30, warning: 50 },
    potassium: { critical: 150, warning: 200 }
  };

  async processSensorData(reading: SensorReading): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Get current weather data
    const weather = await this.getWeatherData(reading.location);

    // Determine growth stage
    const growthStage = this.predictGrowthStage(reading);

    // Analyze current conditions vs Areca requirements
    const moistureAnalysis = this.analyzeMoisture(reading.sensors.moisture, weather);
    const npkAnalysis = this.analyzeNPK(reading.sensors, growthStage);
    const tempAnalysis = this.analyzeTemperature(reading.sensors.temperature, weather);
    const humidityAnalysis = this.analyzeHumidity(reading.sensors.humidity, weather);

    // Generate specific recommendations
    if (moistureAnalysis.needsWater) {
      recommendations.push({
        type: 'watering',
        priority: moistureAnalysis.severity,
        action: moistureAnalysis.action || 'Add water',
        quantity: moistureAnalysis.quantity,
        frequency: moistureAnalysis.frequency,
        reasoning: moistureAnalysis.reasoning,
        confidence: moistureAnalysis.confidence,
        costEstimate: this.calculateWaterCost(moistureAnalysis.quantity || '0ml')
      });
    }

    if (npkAnalysis.needsFertilizer) {
      npkAnalysis.recommendations.forEach((rec: any) => {
        recommendations.push({
          type: 'fertilizer',
          priority: rec.severity,
          action: `Apply ${rec.fertilizer}`,
          quantity: rec.quantity,
          frequency: rec.frequency,
          reasoning: rec.reasoning,
          confidence: rec.confidence,
          costEstimate: this.calculateFertilizerCost(rec.fertilizer, rec.quantity)
        });
      });
    }

    if (tempAnalysis.needsIntervention) {
      recommendations.push({
        type: 'environmental',
        priority: tempAnalysis.severity,
        action: tempAnalysis.action,
        reasoning: tempAnalysis.reasoning,
        confidence: tempAnalysis.confidence,
        costEstimate: tempAnalysis.costEstimate
      });
    }

    if (humidityAnalysis.needsIntervention) {
      recommendations.push({
        type: 'environmental',
        priority: humidityAnalysis.severity,
        action: humidityAnalysis.action,
        reasoning: humidityAnalysis.reasoning,
        confidence: humidityAnalysis.confidence,
        costEstimate: humidityAnalysis.costEstimate
      });
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const scoreA = priorityWeight[a.priority] * a.confidence;
      const scoreB = priorityWeight[b.priority] * b.confidence;
      return scoreB - scoreA;
    });
  }

  private analyzeMoisture(moisture: number, weather: WeatherData) {
    const { critical, warning, high } = this.CRITICAL_THRESHOLDS.moisture;

    if (moisture < critical) {
      return {
        needsWater: true,
        severity: 'critical' as const,
        action: 'Add water immediately',
        quantity: '400-500ml',
        frequency: 'immediate, then every 8 hours',
        reasoning: `Critical moisture level (${moisture}%). Immediate watering required to prevent crop stress.`,
        confidence: 95
      };
    } else if (moisture < warning) {
      let adjustment = weather.rainfall > 0 ? 'reduce by 25%' : 'standard amount';
      return {
        needsWater: true,
        severity: 'high' as const,
        action: 'Add water',
        quantity: `300-400ml (${adjustment})`,
        frequency: 'every 12 hours',
        reasoning: `Low moisture (${moisture}%). ${weather.rainfall > 0 ? 'Expected rain may reduce requirement.' : 'No rain expected.'}`,
        confidence: 85
      };
    } else if (moisture < this.OPTIMAL_RANGES.moisture.min) {
      return {
        needsWater: true,
        severity: 'medium' as const,
        action: 'Add water',
        quantity: '200-300ml',
        frequency: 'daily',
        reasoning: `Moisture below optimal (${moisture}%). Light watering recommended.`,
        confidence: 75
      };
    } else if (moisture > high) {
      return {
        needsWater: true,
        severity: 'medium' as const,
        action: 'Stop watering',
        frequency: 'for 2-3 days',
        reasoning: `Excess moisture (${moisture}%). Risk of root rot. Stop watering temporarily.`,
        confidence: 90
      };
    }

    return { needsWater: false };
  }

  private analyzeNPK(sensors: any, growthStage: GrowthStage) {
    const { nitrogen, phosphorus, potassium } = sensors;
    const recommendations: any[] = [];

    // Nitrogen analysis
    if (nitrogen < this.CRITICAL_THRESHOLDS.nitrogen.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'critical' as const,
        fertilizer: 'Urea',
        quantity: '10-15g',
        frequency: 'immediate, then monthly',
        reasoning: `Critical nitrogen deficiency (${nitrogen} mg/kg). Immediate treatment required.`,
        confidence: 90
      });
    } else if (nitrogen < this.CRITICAL_THRESHOLDS.nitrogen.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'high' as const,
        fertilizer: 'Urea',
        quantity: '5-10g',
        frequency: 'bi-weekly',
        reasoning: `Low nitrogen levels (${nitrogen} mg/kg). Supplement needed.`,
        confidence: 85
      });
    }

    // Phosphorus analysis
    if (phosphorus < this.CRITICAL_THRESHOLDS.phosphorus.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'critical' as const,
        fertilizer: 'SSP (Single Super Phosphate)',
        quantity: '5-8g',
        frequency: 'immediate, then quarterly',
        reasoning: `Critical phosphorus deficiency (${phosphorus} mg/kg). Root development affected.`,
        confidence: 90
      });
    } else if (phosphorus < this.CRITICAL_THRESHOLDS.phosphorus.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'medium' as const,
        fertilizer: 'SSP (Single Super Phosphate)',
        quantity: '3-5g',
        frequency: 'quarterly',
        reasoning: `Low phosphorus (${phosphorus} mg/kg). Moderate supplementation recommended.`,
        confidence: 80
      });
    }

    // Potassium analysis
    if (potassium < this.CRITICAL_THRESHOLDS.potassium.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'high' as const,
        fertilizer: 'MOP (Muriate of Potash)',
        quantity: '5-8g',
        frequency: 'immediate, then quarterly',
        reasoning: `Potassium deficiency (${potassium} mg/kg). Disease resistance reduced.`,
        confidence: 85
      });
    } else if (potassium < this.CRITICAL_THRESHOLDS.potassium.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'medium' as const,
        fertilizer: 'MOP (Muriate of Potash)',
        quantity: '3-5g',
        frequency: 'quarterly',
        reasoning: `Slightly low potassium (${potassium} mg/kg). Light supplementation.`,
        confidence: 75
      });
    }

    // Growth stage adjustments
    if (growthStage.stage === 'juvenile') {
      // Increase nitrogen for growth
      recommendations.forEach(rec => {
        if (rec.fertilizer === 'Urea') {
          const currentQty = parseInt(rec.quantity);
          rec.quantity = `${Math.round(currentQty * 1.2)}-${Math.round(currentQty * 1.5)}g`;
          rec.reasoning += ' Increased for juvenile growth stage.';
        }
      });
    }

    return {
      needsFertilizer: recommendations.length > 0,
      recommendations,
      severity: recommendations.length > 0 ? recommendations[0].severity : 'low'
    };
  }

  private analyzeTemperature(temperature: number, weather: WeatherData) {
    const { min: critMin, max: critMax } = this.CRITICAL_THRESHOLDS.temperature;

    if (temperature > critMax) {
      return {
        needsIntervention: true,
        severity: 'critical' as const,
        action: 'Provide 60% shade netting',
        reasoning: `High temperature (${temperature}°C). Heat stress risk. Shade required immediately.`,
        confidence: 95,
        costEstimate: 1500 // Shade netting cost
      };
    } else if (temperature < critMin) {
      return {
        needsIntervention: true,
        severity: 'high' as const,
        action: 'Move to warmer area or provide heating',
        reasoning: `Low temperature (${temperature}°C). Growth slowed. Warming measures needed.`,
        confidence: 90,
        costEstimate: 800 // Heating cost
      };
    }

    return { needsIntervention: false };
  }

  private analyzeHumidity(humidity: number, weather: WeatherData) {
    const { min: critMin, max: critMax } = this.CRITICAL_THRESHOLDS.humidity;

    if (humidity > critMax) {
      return {
        needsIntervention: true,
        severity: 'high' as const,
        action: 'Improve ventilation, apply preventive fungicide',
        reasoning: `High humidity (${humidity}%) increases fungal disease risk (Bud Rot, Kole Roga).`,
        confidence: 88,
        costEstimate: 200 // Fungicide cost
      };
    } else if (humidity < critMin) {
      return {
        needsIntervention: true,
        severity: 'medium' as const,
        action: 'Increase humidity through misting or irrigation timing',
        reasoning: `Low humidity (${humidity}%) may cause water stress in areca palms.`,
        confidence: 75,
        costEstimate: 50 // Misting system cost
      };
    }

    return { needsIntervention: false };
  }

  private async getWeatherData(location: any): Promise<WeatherData> {
    // In production, integrate with weather API (OpenWeatherMap, etc.)
    // For now, return mock data based on typical areca growing conditions
    return {
      temperature: 28,
      humidity: 75,
      rainfall: Math.random() > 0.7 ? 5 : 0, // 30% chance of rain
      forecast: 'partly cloudy',
      windSpeed: 8
    };
  }

  private predictGrowthStage(reading: SensorReading): GrowthStage {
    // Simplified growth stage prediction
    // In production, use historical data and ML models
    const daysSinceFirstReading = this.getDaysSinceFirstReading(reading.sensor_id);

    if (daysSinceFirstReading < 90) {
      return { stage: 'seedling', ageMonths: Math.round(daysSinceFirstReading / 30), expectedYield: 0 };
    } else if (daysSinceFirstReading < 365) {
      return { stage: 'juvenile', ageMonths: Math.round(daysSinceFirstReading / 30), expectedYield: 50 };
    } else if (daysSinceFirstReading < 1825) {
      return { stage: 'mature', ageMonths: Math.round(daysSinceFirstReading / 30), expectedYield: 85 };
    } else {
      return { stage: 'harvest', ageMonths: Math.round(daysSinceFirstReading / 30), expectedYield: 100 };
    }
  }

  private getDaysSinceFirstReading(sensorId: string): number {
    // Mock implementation - in production, query database
    return Math.floor(Math.random() * 2000) + 30; // 30 days to 5+ years
  }

  private calculateWaterCost(quantity: string): number {
    // Calculate water cost based on quantity
    const match = quantity.match(/(\d+)/);
    if (!match) return 0;

    const ml = parseInt(match[1]);
    const liters = ml / 1000;
    return liters * 0.002; // Rs. 0.002 per liter (agricultural rate)
  }

  private calculateFertilizerCost(type: string, quantity: string): number {
    // Calculate fertilizer cost
    const match = quantity.match(/(\d+)/);
    if (!match) return 0;

    const grams = parseInt(match[1]);
    const costPerGram = {
      'Urea': 0.05,      // Rs. 50 per kg
      'SSP': 0.08,       // Rs. 80 per kg
      'MOP': 0.06        // Rs. 60 per kg
    };

    const fertilizerType = type.includes('Urea') ? 'Urea' :
                          type.includes('SSP') ? 'SSP' : 'MOP';

    return grams * (costPerGram[fertilizerType as keyof typeof costPerGram] || 0.05);
  }
}

export const arecaAIEngine = new ArecaAIEngine();