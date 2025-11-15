import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

// Sensor data validation schema
export const sensorDataSchema = Joi.object({
  deviceId: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  sensorData: Joi.object({
    temperature: Joi.number().min(-50).max(100).required(),
    humidity: Joi.number().min(0).max(100).required(),
    moisture: Joi.number().min(0).max(100).required(),
    nitrogen: Joi.number().min(0).max(500).required(),
    phosphorus: Joi.number().min(0).max(200).required(),
    potassium: Joi.number().min(0).max(500).required()
  }).required(),
  system: Joi.object({
    battery: Joi.number().min(0).max(100).required(),
    signal: Joi.number().min(-120).max(0).required(),
    uptime: Joi.number().min(0).required()
  }).required()
});

// ESP8266 sensor data schema (simplified)
export const espSensorDataSchema = Joi.object({
  deviceId: Joi.string().required(),
  temperature: Joi.number().min(-50).max(100).required(),
  humidity: Joi.number().min(0).max(100).required(),
  moisture: Joi.number().min(0).max(100).required(),
  N: Joi.number().min(0).max(500).required(),
  P: Joi.number().min(0).max(200).required(),
  K: Joi.number().min(0).max(500).required()
});

// User registration schema
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  farmName: Joi.string().min(2).max(100).required(),
  location: Joi.string().min(2).max(200).required()
});

// User login schema
export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Report request schema
export const reportRequestSchema = Joi.object({
  date: Joi.date().optional(),
  deviceId: Joi.string().optional(),
  format: Joi.string().valid('pdf', 'csv').default('pdf')
});

// Date range query schema
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  deviceId: Joi.string().optional()
});

// AI feedback schema
export const aiFeedbackSchema = Joi.object({
  deviceId: Joi.string().required(),
  recommendationId: Joi.string().required(),
  feedback: Joi.object({
    applied: Joi.boolean().required(),
    effectiveness: Joi.number().min(1).max(5).required(),
    notes: Joi.string().max(500).optional()
  }).required()
});