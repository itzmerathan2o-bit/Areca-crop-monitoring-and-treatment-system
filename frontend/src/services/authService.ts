import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseService } from './firebaseService';
import { UserProfile } from '../types/sensors';

export class AuthService {
  private auth = auth;

  // Listen to authentication state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  // Login with email and password
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Register new user
  async register(email: string, password: string, farmName: string, location: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Create user profile
      const userProfile: Omit<UserProfile, 'userId'> = {
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
        }
      };

      await firebaseService.createUserProfile(user.uid, userProfile);

      return user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Reset password (optional implementation)
  async resetPassword(email: string): Promise<void> {
    // Implementation would go here if needed
    throw new Error('Password reset not implemented');
  }

  // Get user-friendly error messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or login.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or register.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password with at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export const authService = new AuthService();