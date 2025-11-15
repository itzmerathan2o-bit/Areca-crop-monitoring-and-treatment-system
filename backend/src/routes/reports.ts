import express from 'express';
import admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateQuery, reportRequestSchema } from '../middleware/validation';
import { pdfReportService } from '../services/pdfReportService';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Generate daily report
router.get('/daily', validateQuery(reportRequestSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { date } = req.query;
  const userId = req.user!.uid;

  try {
    const reportDate = date ? new Date(date as string) : new Date();

    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateDailyReport(reportDate);

    // Save report URL to Firebase Storage (optional)
    const reportUrl = await saveReportToStorage(userId, 'daily', reportDate, pdfBuffer);

    // Set headers for PDF download
    const filename = `areca-daily-report-${reportDate.toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating daily report:', error);
    throw new AppError('Failed to generate daily report', 500);
  }
}));

// Generate weekly report
router.get('/weekly', validateQuery(reportRequestSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { date } = req.query;
  const userId = req.user!.uid;

  try {
    const reportDate = date ? new Date(date as string) : new Date();

    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateWeeklyReport(reportDate);

    // Save report URL to Firebase Storage (optional)
    const reportUrl = await saveReportToStorage(userId, 'weekly', reportDate, pdfBuffer);

    // Set headers for PDF download
    const filename = `areca-weekly-report-${reportDate.toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw new AppError('Failed to generate weekly report', 500);
  }
}));

// Generate monthly report
router.get('/monthly', validateQuery(reportRequestSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { date } = req.query;
  const userId = req.user!.uid;

  try {
    const reportDate = date ? new Date(date as string) : new Date();

    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateMonthlyReport(reportDate);

    // Save report URL to Firebase Storage (optional)
    const reportUrl = await saveReportToStorage(userId, 'monthly', reportDate, pdfBuffer);

    // Set headers for PDF download
    const filename = `areca-monthly-report-${reportDate.toISOString().slice(0, 7)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw new AppError('Failed to generate monthly report', 500);
  }
}));

// Generate complete report
router.get('/all', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.uid;

  try {
    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateCompleteReport();

    // Save report URL to Firebase Storage (optional)
    const reportUrl = await saveReportToStorage(userId, 'complete', new Date(), pdfBuffer);

    // Set headers for PDF download
    const filename = `areca-complete-report-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating complete report:', error);
    throw new AppError('Failed to generate complete report', 500);
  }
}));

// Get list of available reports
router.get('/list', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.uid;

  try {
    const db = admin.database();
    const reportsRef = db.ref(`reports/${userId}`);
    const snapshot = await reportsRef.get();

    if (!snapshot.exists()) {
      return res.status(200).json({
        success: true,
        data: {
          daily: {},
          weekly: {},
          monthly: {},
          complete: {}
        }
      });
    }

    const reports = snapshot.val();

    res.status(200).json({
      success: true,
      data: {
        daily: reports.daily || {},
        weekly: reports.weekly || {},
        monthly: reports.monthly || {},
        complete: reports.complete || {}
      }
    });

  } catch (error) {
    console.error('Error fetching reports list:', error);
    throw new AppError('Failed to fetch reports list', 500);
  }
}));

// Delete a report
router.delete('/:reportType/:dateKey', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { reportType, dateKey } = req.params;
  const userId = req.user!.uid;

  // Validate report type
  const validTypes = ['daily', 'weekly', 'monthly', 'complete'];
  if (!validTypes.includes(reportType)) {
    throw new AppError('Invalid report type', 400);
  }

  try {
    const db = admin.database();
    const reportRef = db.ref(`reports/${userId}/${reportType}/${dateKey}`);

    // Delete from Firebase Storage if URL exists
    const snapshot = await reportRef.get();
    if (snapshot.exists()) {
      const reportData = snapshot.val();
      if (reportData.url) {
        await deleteReportFromStorage(reportData.url);
      }
    }

    // Delete from database
    await reportRef.remove();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    throw new AppError('Failed to delete report', 500);
  }
}));

// Helper function to save report to Firebase Storage
async function saveReportToStorage(userId: string, reportType: string, date: Date, pdfBuffer: Buffer): Promise<string> {
  try {
    const storage = admin.storage();
    const bucket = storage.bucket();

    // Generate filename
    const dateKey = reportType === 'complete' ?
      new Date().toISOString().split('T')[0] :
      reportType === 'monthly' ?
      date.toISOString().slice(0, 7) :
      date.toISOString().split('T')[0];

    const filename = `reports/${userId}/${reportType}/${dateKey}.pdf`;

    // Upload to Firebase Storage
    const file = bucket.file(filename);
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          userId,
          reportType,
          generatedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly accessible (or use signed URLs)
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Save URL to database
    const db = admin.database();
    await db.ref(`reports/${userId}/${reportType}/${dateKey}`).set({
      url: publicUrl,
      filename,
      generatedAt: new Date().toISOString(),
      size: pdfBuffer.length
    });

    return publicUrl;

  } catch (error) {
    console.error('Error saving report to storage:', error);
    throw error;
  }
}

// Helper function to delete report from Firebase Storage
async function deleteReportFromStorage(url: string): Promise<void> {
  try {
    const storage = admin.storage();
    const bucket = storage.bucket();

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts.slice(-2).join('/'); // reports/userId/reportType/filename.pdf

    const file = bucket.file(filename);
    await file.delete();

    console.log(`Deleted report from storage: ${filename}`);

  } catch (error) {
    console.error('Error deleting report from storage:', error);
    // Don't throw error here, as the database record deletion is more important
  }
}

export default router;