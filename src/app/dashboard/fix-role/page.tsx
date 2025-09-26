'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function FixRolePage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('service_provider');

  const handleFixRole = async () => {
    if (!token) {
      setMessage('Please log in first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/fix-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newRole: selectedRole })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Success! Your role has been updated to: ${selectedRole}. Please refresh the page or log out and log back in to see the changes.`);
      } else {
        console.error('Role update failed:', data);
        setMessage(`❌ Error: ${data.error || 'Failed to update role'}${data.details ? ` - ${data.details}` : ''}`);
      }
    } catch (error) {
      console.error('Role update error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestToken = async () => {
    if (!token) {
      setTestMessage('Please log in first');
      return;
    }

    setTestLoading(true);
    setTestMessage('');

    try {
      const response = await fetch('/api/auth/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setTestMessage(`✅ Token is valid! User ID: ${data.user.userId}, Email: ${data.user.email}`);
      } else {
        console.error('Token test failed:', data);
        setTestMessage(`❌ Token Error: ${data.error}${data.details ? ` - ${data.details}` : ''}`);
      }
    } catch (error) {
      console.error('Token test error:', error);
      setTestMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to fix your user role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Fix User Role</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Current User Info:</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {(user as any)?.full_name || user.email}</p>
            <p><strong>Current Role:</strong> {user.role || 'Not set'}</p>
            <p><strong>User Type:</strong> {user.user_type || 'Not set'}</p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Correct Role:
          </label>
          <select
            id="roleSelect"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="buyer">Buyer/Importer</option>
            <option value="seller">Seller/Exporter</option>
            <option value="service_provider">Service Provider</option>
          </select>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTestToken}
            disabled={testLoading}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testLoading ? 'Testing...' : 'Test Token (Debug)'}
          </button>
          
          <button
            onClick={handleFixRole}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Role'}
          </button>
        </div>

        {testMessage && (
          <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">{testMessage}</p>
          </div>
        )}

        {message && (
          <div className="mt-4 p-4 rounded-md bg-gray-50 border">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Note:</strong> This tool is for users who were registered with the wrong role due to a previous bug. After updating your role, you may need to refresh the page or log out and log back in to see the changes reflected in the dashboard.</p>
        </div>
      </div>
    </div>
  );
}
