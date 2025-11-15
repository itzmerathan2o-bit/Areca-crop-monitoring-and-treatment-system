import PDFDocument from 'pdfkit';
import { SensorReading, AIRecommendation } from '../types/sensors';
import { format } from 'date-fns';

interface ReportData {
  title: string;
  dateRange: { start: Date; end: Date };
  sensorData: SensorReading[];
  aiRecommendations: AIRecommendation[];
  summary: {
    totalReadings: number;
    averageTemperature: number;
    averageHumidity: number;
    averageMoisture: number;
    averageNPK: { N: number; P: number; K: number };
    healthStatus: 'healthy' | 'moderate' | 'critical';
    treatmentCount: number;
  };
}

export class PDFReportService {
  async generateDailyReport(date: Date): Promise<Buffer> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.generateReport('Daily Report', startOfDay, endOfDay);
  }

  async generateWeeklyReport(date: Date): Promise<Buffer> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.generateReport('Weekly Report', startOfWeek, endOfWeek);
  }

  async generateMonthlyReport(date: Date): Promise<Buffer> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.generateReport('Monthly Report', startOfMonth, endOfMonth);
  }

  async generateCompleteReport(): Promise<Buffer> {
    const allData = await this.getAllSensorData();
    if (allData.length === 0) {
      throw new Error('No sensor data available for complete report');
    }

    const startDate = new Date(Math.min(...allData.map(d => new Date(d.timestamp).getTime())));
    const endDate = new Date(Math.max(...allData.map(d => new Date(d.timestamp).getTime())));

    return this.generateReport('Complete Report', startDate, endDate);
  }

  private async generateReport(title: string, startDate: Date, endDate: Date): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk));

    try {
      // Add professional fonts
      doc.font('Helvetica');

      // Report Header
      this.addReportHeader(doc, title, startDate, endDate);

      // Get report data
      const reportData = await this.getReportData(startDate, endDate);

      // Executive Summary
      this.addExecutiveSummary(doc, reportData);

      // Sensor Data Summary
      this.addSensorDataSummary(doc, reportData);

      // AI Recommendations Summary
      this.addAIRecommendationsSummary(doc, reportData);

      // Detailed Readings Table
      this.addDetailedReadingsTable(doc, reportData);

      // Charts placeholder
      this.addChartsSection(doc);

      // Footer
      this.addFooter(doc);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error) => {
        reject(error);
      });
    });
  }

  private addReportHeader(doc: PDFDocument, title: string, startDate: Date, endDate: Date) {
    // Professional header
    doc.fontSize(24).font('Helvetica-Bold').text('🌱 SMART ARECA CROP MONITORING SYSTEM', { align: 'center' });
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    // Date range
    doc.fontSize(12).font('Helvetica').text(`Report Period: ${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, { align: 'center' });

    // Separator line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(2);
  }

  private addExecutiveSummary(doc: PDFDocument, data: ReportData) {
    doc.fontSize(16).font('Helvetica-Bold').text('📊 EXECUTIVE SUMMARY', { underline: true });
    doc.moveDown();

    // Health Status
    const healthColor = data.summary.healthStatus === 'healthy' ? 'green' :
                       data.summary.healthStatus === 'moderate' ? 'orange' : 'red';

    doc.fontSize(12).font('Helvetica').text(`Overall Health Status: ${data.summary.healthStatus.toUpperCase()}`);
    doc.text(`Total Sensor Readings: ${data.summary.totalReadings}`);
    doc.text(`Treatment Recommendations: ${data.summary.treatmentCount}`);
    doc.moveDown();

    // Key metrics
    doc.text('Key Performance Indicators:');
    doc.text(`• Average Temperature: ${data.summary.averageTemperature.toFixed(1)}°C`);
    doc.text(`• Average Humidity: ${data.summary.averageHumidity.toFixed(1)}%`);
    doc.text(`• Average Soil Moisture: ${data.summary.averageMoisture.toFixed(1)}%`);
    doc.text(`• Average NPK - N: ${data.summary.averageNPK.N.toFixed(0)}, P: ${data.summary.averageNPK.P.toFixed(0)}, K: ${data.summary.averageNPK.K.toFixed(0)} mg/kg`);
    doc.moveDown(2);
  }

  private addSensorDataSummary(doc: PDFDocument, data: ReportData) {
    doc.fontSize(16).font('Helvetica-Bold').text('📈 SENSOR DATA ANALYSIS', { underline: true });
    doc.moveDown();

    // Temperature analysis
    doc.fontSize(14).font('Helvetica-Bold').text('Temperature Analysis');
    doc.fontSize(12).font('Helvetica').text(`Range: ${this.getMinMax(data.sensorData, 'temperature')}`);
    doc.text(`Optimal Range Percentage: ${this.calculateOptimalPercentage(data.sensorData, 'temperature', 22, 32)}%`);
    doc.moveDown();

    // Humidity analysis
    doc.fontSize(14).font('Helvetica-Bold').text('Humidity Analysis');
    doc.fontSize(12).font('Helvetica').text(`Range: ${this.getMinMax(data.sensorData, 'humidity')}`);
    doc.text(`Optimal Range Percentage: ${this.calculateOptimalPercentage(data.sensorData, 'humidity', 60, 80)}%`);
    doc.moveDown();

    // Moisture analysis
    doc.fontSize(14).font('Helvetica-Bold').text('Soil Moisture Analysis');
    doc.fontSize(12).font('Helvetica').text(`Range: ${this.getMinMax(data.sensorData, 'moisture')}`);
    doc.text(`Optimal Range Percentage: ${this.calculateOptimalPercentage(data.sensorData, 'moisture', 50, 70)}%`);
    doc.moveDown();

    // NPK analysis
    doc.fontSize(14).font('Helvetica-Bold').text('NPK Nutrient Analysis');
    doc.fontSize(12).font('Helvetica').text(`Nitrogen Range: ${this.getMinMax(data.sensorData, 'nitrogen')} mg/kg`);
    doc.text(`Phosphorus Range: ${this.getMinMax(data.sensorData, 'phosphorus')} mg/kg`);
    doc.text(`Potassium Range: ${this.getMinMax(data.sensorData, 'potassium')} mg/kg`);
    doc.moveDown(2);
  }

  private addAIRecommendationsSummary(doc: PDFDocument, data: ReportData) {
    doc.fontSize(16).font('Helvetica-Bold').text('🤖 AI TREATMENT RECOMMENDATIONS', { underline: true });
    doc.moveDown();

    if (data.aiRecommendations.length === 0) {
      doc.text('No critical treatment recommendations at this time.');
      doc.moveDown(2);
      return;
    }

    // Group recommendations by type
    const groupedRecs = this.groupRecommendations(data.aiRecommendations);

    Object.entries(groupedRecs).forEach(([type, recs]) => {
      doc.fontSize(14).font('Helvetica-Bold').text(`${type.toUpperCase()} RECOMMENDATIONS`);

      recs.forEach((rec, index) => {
        doc.fontSize(12).font('Helvetica');
        doc.text(`${index + 1}. ${rec.action} ${rec.quantity ? `(${rec.quantity})` : ''}`);
        doc.text(`   Priority: ${rec.priority.toUpperCase()} | Confidence: ${rec.confidence}%`);
        doc.text(`   Reasoning: ${rec.reasoning}`);
        if (rec.costEstimate) {
          doc.text(`   Estimated Cost: Rs. ${rec.costEstimate.toFixed(2)}`);
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    });
  }

  private addDetailedReadingsTable(doc: PDFDocument, data: ReportData) {
    doc.fontSize(16).font('Helvetica-Bold').text('📋 DETAILED SENSOR READINGS', { underline: true });
    doc.moveDown();

    // Table headers
    const headers = ['Date/Time', 'Temp (°C)', 'Humidity (%)', 'Moisture (%)', 'N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)', 'Status'];
    const columnWidths = [80, 50, 50, 50, 50, 50, 50, 60];

    // Draw table header
    let xPos = 50;
    headers.forEach((header, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, xPos, doc.y, { width: columnWidths[index] });
      xPos += columnWidths[index];
    });
    doc.moveDown(0.5);

    // Draw separator line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    // Add data (limit to last 20 readings for space)
    const recentReadings = data.sensorData.slice(-20);
    recentReadings.forEach(reading => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        // Redraw headers on new page
        xPos = 50;
        headers.forEach((header, index) => {
          doc.fontSize(10).font('Helvetica-Bold').text(header, xPos, doc.y, { width: columnWidths[index] });
          xPos += columnWidths[index];
        });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        xPos = 50;
      }

      // Table data
      xPos = 50;
      const date = format(new Date(reading.timestamp), 'dd/MM/yy');
      const time = format(new Date(reading.timestamp), 'HH:mm');

      doc.fontSize(9).font('Helvetica').text(`${date} ${time}`, xPos, doc.y, { width: columnWidths[0] });
      xPos += columnWidths[0];
      doc.text(reading.sensors.temperature.toFixed(1), xPos, doc.y, { width: columnWidths[1] });
      xPos += columnWidths[1];
      doc.text(reading.sensors.humidity.toFixed(0), xPos, doc.y, { width: columnWidths[2] });
      xPos += columnWidths[2];
      doc.text(reading.sensors.moisture.toFixed(0), xPos, doc.y, { width: columnWidths[3] });
      xPos += columnWidths[3];
      doc.text(reading.sensors.nitrogen.toFixed(0), xPos, doc.y, { width: columnWidths[4] });
      xPos += columnWidths[4];
      doc.text(reading.sensors.phosphorus.toFixed(0), xPos, doc.y, { width: columnWidths[5] });
      xPos += columnWidths[5];
      doc.text(reading.sensors.potassium.toFixed(0), xPos, doc.y, { width: columnWidths[6] });
      xPos += columnWidths[6];

      const status = this.getOverallStatus(reading);
      doc.text(status, xPos, doc.y, { width: columnWidths[7] });
      doc.moveDown(0.4);
    });
  }

  private addChartsSection(doc: PDFDocument) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('📊 VISUAL ANALYTICS', { underline: true });
    doc.moveDown();

    // Note about charts
    doc.fontSize(12).font('Helvetica').text('Chart visualizations would be embedded here using a chart generation library.');
    doc.text('Charts would include:');
    doc.text('• Temperature trends over time');
    doc.text('• NPK nutrient level charts');
    doc.text('• Soil moisture patterns');
    doc.text('• Treatment effectiveness metrics');
  }

  private addFooter(doc: PDFDocument) {
    const pages = doc.bufferedPageCount();
    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.moveTo(50, 800).lineTo(545, 800).stroke();

      // Footer text
      doc.fontSize(10).font('Helvetica').text('Smart Areca Crop Monitoring System v2.0', 50, 810, { align: 'left' });
      doc.text(`Page ${i + 1} of ${pages}`, 50, 810, { align: 'center' });
      doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 50, 810, { align: 'right' });
    }
  }

  // Helper methods
  private async getReportData(startDate: Date, endDate: Date): Promise<ReportData> {
    // Mock implementation - in production, query actual database
    const sensorData = await this.getSensorDataInRange(startDate, endDate);
    const aiRecommendations = await this.getAIRecommendationsInRange(startDate, endDate);

    return {
      title: 'Areca Monitoring Report',
      dateRange: { start: startDate, end: endDate },
      sensorData,
      aiRecommendations,
      summary: this.calculateSummary(sensorData, aiRecommendations)
    };
  }

  private calculateSummary(sensorData: SensorReading[], aiRecommendations: AIRecommendation[]) {
    if (sensorData.length === 0) {
      return {
        totalReadings: 0,
        averageTemperature: 0,
        averageHumidity: 0,
        averageMoisture: 0,
        averageNPK: { N: 0, P: 0, K: 0 },
        healthStatus: 'healthy' as const,
        treatmentCount: aiRecommendations.length
      };
    }

    const avgTemp = sensorData.reduce((sum, d) => sum + d.sensors.temperature, 0) / sensorData.length;
    const avgHumidity = sensorData.reduce((sum, d) => sum + d.sensors.humidity, 0) / sensorData.length;
    const avgMoisture = sensorData.reduce((sum, d) => sum + d.sensors.moisture, 0) / sensorData.length;
    const avgN = sensorData.reduce((sum, d) => sum + d.sensors.nitrogen, 0) / sensorData.length;
    const avgP = sensorData.reduce((sum, d) => sum + d.sensors.phosphorus, 0) / sensorData.length;
    const avgK = sensorData.reduce((sum, d) => sum + d.sensors.potassium, 0) / sensorData.length;

    const criticalRecommendations = aiRecommendations.filter(r => r.priority === 'critical').length;
    const healthStatus = criticalRecommendations > 0 ? 'critical' :
                        aiRecommendations.filter(r => r.priority === 'high').length > 0 ? 'moderate' : 'healthy';

    return {
      totalReadings: sensorData.length,
      averageTemperature: avgTemp,
      averageHumidity: avgHumidity,
      averageMoisture: avgMoisture,
      averageNPK: { N: avgN, P: avgP, K: avgK },
      healthStatus,
      treatmentCount: aiRecommendations.length
    };
  }

  private getMinMax(data: SensorReading[], metric: keyof SensorData): string {
    if (data.length === 0) return 'N/A';

    const values = data.map(d => d.sensors[metric] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return `${min.toFixed(1)} - ${max.toFixed(1)}`;
  }

  private calculateOptimalPercentage(data: SensorReading[], metric: keyof SensorData, min: number, max: number): number {
    if (data.length === 0) return 0;

    const optimalReadings = data.filter(d => {
      const value = d.sensors[metric] as number;
      return value >= min && value <= max;
    });

    return Math.round((optimalReadings.length / data.length) * 100);
  }

  private getOverallStatus(reading: SensorReading): string {
    const { temperature, humidity, moisture, nitrogen, phosphorus, potassium } = reading.sensors;

    const isCritical =
      temperature < 20 || temperature > 35 ||
      humidity < 40 || humidity > 90 ||
      moisture < 25 ||
      nitrogen < 200 ||
      phosphorus < 30 ||
      potassium < 150;

    const isWarning =
      temperature < 22 || temperature > 32 ||
      humidity < 60 || humidity > 80 ||
      moisture < 50 || moisture > 75 ||
      nitrogen < 250 ||
      phosphorus < 50 ||
      potassium < 200;

    if (isCritical) return 'CRITICAL';
    if (isWarning) return 'WARNING';
    return 'OPTIMAL';
  }

  private groupRecommendations(recommendations: AIRecommendation[]): Record<string, AIRecommendation[]> {
    return recommendations.reduce((groups, rec) => {
      if (!groups[rec.type]) {
        groups[rec.type] = [];
      }
      groups[rec.type].push(rec);
      return groups;
    }, {} as Record<string, AIRecommendation[]>);
  }

  // Mock data methods - replace with actual database queries
  private async getAllSensorData(): Promise<SensorReading[]> {
    // Mock implementation
    return [];
  }

  private async getSensorDataInRange(startDate: Date, endDate: Date): Promise<SensorReading[]> {
    // Mock implementation - in production, query database
    return [];
  }

  private async getAIRecommendationsInRange(startDate: Date, endDate: Date): Promise<AIRecommendation[]> {
    // Mock implementation - in production, query database
    return [];
  }
}

export const pdfReportService = new PDFReportService();