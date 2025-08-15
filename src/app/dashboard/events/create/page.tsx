"use client";

import React, { useState } from 'react';
import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext'; // Uncomment if auth is needed

export default function CreateEventPage() {
  // const { user } = useAuth(); // Uncomment if auth is needed
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!eventName || !eventDate || !eventLocation || !eventDescription) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    // TODO: Implement API call to backend to create the event
    console.log('Form submitted (not yet implemented):', {
      eventName,
      eventDate,
      eventLocation,
      eventDescription,
    });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Replace with actual API call:
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation, description: eventDescription, created_by: user?.id }),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.msg || 'Failed to create event');
      // }
      // const newEvent = await response.json();
      setSuccessMessage(`Event \"${eventName}\" created successfully (simulation).`);
      // Reset form or redirect
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Create New Event</h1>
        <Link href="/dashboard/events" className="text-sky-600 hover:text-sky-800">
          &larr; Back to Events
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            <span className="font-medium">Success:</span> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              name="eventName"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="datetime-local"
              name="eventDate"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="eventLocation"
              id="eventLocation"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="eventDescription"
              id="eventDescription"
              rows={4}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}