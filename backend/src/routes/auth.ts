import express from 'express';
import admin from 'firebase-admin';
import { validateBody, userRegistrationSchema, userLoginSchema } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Register new user
router.post('/register', validateBody(userRegistrationSchema), asyncHandler(async (req, res) => {
  const { email, password, farmName, location } = req.body;

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: farmName
    });

    // Create user profile in Firebase Database
    const userProfile = {
      email,
      farm_name: farmName,
      location,
      devices: [],
      settings: {
        alert_thresholds: {
          temperature: {
            critical_min: 20,
            critical_max: 35,
            optimal_min: 22,
            optimal_max: 32
          },
          humidity: {
            critical_min: 40,
            critical_max: 90,
            optimal_min: 60,
            optimal_max: 80
          },
          moisture: {
            critical: 25,
            warning: 50,
            optimal_min: 50,
            optimal_max: 70,
            high_max: 75
          },
          nitrogen: {
            critical: 200,
            warning: 250,
            optimal_min: 250
          },
          phosphorus: {
            critical: 30,
            warning: 50,
            optimal_min: 50
          },
          potassium: {
            critical: 150,
            warning: 200,
            optimal_min: 200
          }
        },
        notifications: true
      },
      created_at: admin.database.ServerValue.TIMESTAMP,
      last_login: admin.database.ServerValue.TIMESTAMP
    };

    await admin.database().ref(`user_profiles/${userRecord.uid}`).set(userProfile);

    // Create custom token for client-side login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      throw new AppError('Email already registered. Please use a different email or login.', 400);
    }

    if (error.code === 'auth/invalid-email') {
      throw new AppError('Invalid email address.', 400);
    }

    if (error.code === 'auth/weak-password') {
      throw new AppError('Password is too weak. Please use a stronger password.', 400);
    }

    throw new AppError('Registration failed. Please try again.', 500);
  }
}));

// Login user
router.post('/login', validateBody(userLoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Note: In a real implementation, you'd use Firebase Admin SDK to verify credentials
    // or use Firebase Client SDK on the frontend. For this backend service,
    // we'll create a custom token after verifying the user exists.

    const userRecord = await admin.auth().getUserByEmail(email);

    if (!userRecord) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await admin.database().ref(`user_profiles/${userRecord.uid}/last_login`).set(admin.database.ServerValue.TIMESTAMP);

    // Create custom token for client-side authentication
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.code === 'auth/user-not-found') {
      throw new AppError('Invalid email or password', 401);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Login failed. Please try again.', 500);
  }
}));

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    throw new AppError('Authorization token is required', 401);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRef = admin.database().ref(`user_profiles/${decodedToken.uid}`);
    const snapshot = await userRef.get();

    if (!snapshot.exists()) {
      throw new AppError('User profile not found', 404);
    }

    const userProfile = snapshot.val();

    res.status(200).json({
      success: true,
      data: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userProfile
      }
    });

  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      throw new AppError('Token expired. Please login again.', 401);
    }

    if (error.code === 'auth/id-token-revoked') {
      throw new AppError('Token revoked. Please login again.', 401);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to get user profile', 500);
  }
}));

// Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    throw new AppError('Authorization token is required', 401);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.uid;
    delete updates.email;
    delete updates.created_at;

    // Add updated timestamp
    updates.updated_at = admin.database.ServerValue.TIMESTAMP;

    const userRef = admin.database().ref(`user_profiles/${decodedToken.uid}`);
    await userRef.update(updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      throw new AppError('Token expired. Please login again.', 401);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to update profile', 500);
  }
}));

// Delete user account
router.delete('/account', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    throw new AppError('Authorization token is required', 401);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(decodedToken.uid);

    // Delete user profile from database
    await admin.database().ref(`user_profiles/${decodedToken.uid}`).remove();

    // Delete user's sensor data (optional - you might want to keep this)
    await admin.database().ref(`sensor_data/${decodedToken.uid}`).remove();
    await admin.database().ref(`ai_recommendations/${decodedToken.uid}`).remove();
    await admin.database().ref(`reports/${decodedToken.uid}`).remove();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      throw new AppError('Token expired. Please login again.', 401);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to delete account', 500);
  }
}));

export default router;