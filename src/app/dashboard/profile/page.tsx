'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatWidget from '../../components/messaging/ChatWidget';

export default function ProfilePage() {
  const { user, token, isLoading: authLoading } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!token) {
      setMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, { // Assuming PUT to /api/auth/me for updates
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile. Please try again.' }));
        throw new Error(errorData.message || 'Failed to update profile.');
      }

      // Optionally, update user in AuthContext if backend returns updated user
      // const updatedUser = await response.json();
      // login(token, updatedUser); // This would require login function to not redirect
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="p-6"><p>Loading profile...</p></div>;
  }

  if (!user) {
    return <div className="p-6"><p>Please log in to view your profile.</p></div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Your Profile</h1>

      {message && (
        <div 
          className={`p-4 mb-6 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            readOnly
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-slate-700 mb-1">
            User Type
          </label>
          <input
            type="text"
            id="userType"
            value={(user.user_type?.charAt(0).toUpperCase() ?? '') + (user.user_type?.slice(1) ?? '')}
            readOnly
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 transition duration-150 ease-in-out"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
