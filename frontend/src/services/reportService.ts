import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class ReportService {
  private apiBase = API_BASE_URL;

  // Generate daily report
  async generateDailyReport(date: Date = new Date()): Promise<Blob> {
    try {
      const response = await axios.get(`${this.apiBase}/reports/daily`, {
        params: { date: date.toISOString().split('T')[0] },
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate daily report:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate daily report');
    }
  }

  // Generate weekly report
  async generateWeeklyReport(date: Date = new Date()): Promise<Blob> {
    try {
      const response = await axios.get(`${this.apiBase}/reports/weekly`, {
        params: { date: date.toISOString().split('T')[0] },
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate weekly report:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate weekly report');
    }
  }

  // Generate monthly report
  async generateMonthlyReport(date: Date = new Date()): Promise<Blob> {
    try {
      const response = await axios.get(`${this.apiBase}/reports/monthly`, {
        params: { date: date.toISOString().split('T')[0] },
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate monthly report:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate monthly report');
    }
  }

  // Generate complete report (all data)
  async generateCompleteReport(): Promise<Blob> {
    try {
      const response = await axios.get(`${this.apiBase}/reports/all`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate complete report:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate complete report');
    }
  }

  // Download helper function
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Generate and download daily report
  async downloadDailyReport(date?: Date): Promise<void> {
    const blob = await this.generateDailyReport(date);
    const reportDate = (date || new Date()).toISOString().split('T')[0];
    this.downloadPDF(blob, `areca-daily-report-${reportDate}.pdf`);
  }

  // Generate and download weekly report
  async downloadWeeklyReport(date?: Date): Promise<void> {
    const blob = await this.generateWeeklyReport(date);
    const reportDate = (date || new Date()).toISOString().split('T')[0];
    this.downloadPDF(blob, `areca-weekly-report-${reportDate}.pdf`);
  }

  // Generate and download monthly report
  async downloadMonthlyReport(date?: Date): Promise<void> {
    const blob = await this.generateMonthlyReport(date);
    const reportDate = (date || new Date()).toISOString().slice(0, 7);
    this.downloadPDF(blob, `areca-monthly-report-${reportDate}.pdf`);
  }

  // Generate and download complete report
  async downloadCompleteReport(): Promise<void> {
    const blob = await this.generateCompleteReport();
    const today = new Date().toISOString().split('T')[0];
    this.downloadPDF(blob, `areca-complete-report-${today}.pdf`);
  }
}

export const reportService = new ReportService();