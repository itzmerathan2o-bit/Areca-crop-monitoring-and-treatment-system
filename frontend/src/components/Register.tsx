import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.register(
        formData.email,
        formData.password,
        formData.farmName,
        formData.location
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-500/20">
            <span className="text-4xl">🌱</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            AgroSense AI
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Areca Crop Monitoring & Treatment System
          </p>
          <p className="mt-4 text-lg text-gray-300">
            Create your account
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="farmName" className="block text-sm font-medium text-gray-300 mb-2">
                Farm Name
              </label>
              <input
                id="farmName"
                name="farmName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 bg-gray-800 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter your farm name"
                value={formData.farmName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Farm Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 bg-gray-800 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="City, State, Country"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 bg-gray-800 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 bg-gray-800 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 bg-gray-800 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </span>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          {/* Links */}
          <div className="text-center">
            <Link to="/login" className="font-medium text-green-400 hover:text-green-300">
              Already have an account? Sign in
            </Link>
          </div>
        </form>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm font-semibold text-gray-300 mb-2">🌟 What you'll get:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>✓ Real-time monitoring of NPK levels</li>
            <li>✓ AI-powered treatment recommendations</li>
            <li>✓ Environmental alerts and warnings</li>
            <li>✓ Comprehensive PDF reports</li>
            <li>✓ Mobile-responsive dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;