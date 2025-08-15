'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Event {
  id: number;
  title: string;
  event_date: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  registration_link: string | null;
  is_published: boolean;
  user_id: number | null;
  user_email?: string; // From JOIN in backend
  created_at: string;
  updated_at: string;
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

export default function ManageEventsPage() {
  console.log('[ManageEventsPage] Component rendering/re-rendering');
  const { user, isLoading: authIsLoading, token } = useAuth();
  console.log('[ManageEventsPage] AuthContext state:', { user, authIsLoading, tokenExists: !!token });
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }
    console.log('[ManageEventsPage] fetchEvents called.');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events/all/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ManageEventsPage] fetchEvents API error. Status:', response.status, 'Data:', errorData);
        if (response.status === 403) {
          throw new Error(errorData.msg || 'Access Denied: You do not have permission to view all events.');
        } else {
          throw new Error(errorData.msg || `Failed to fetch events: ${response.status}`);
        }
      }
      const data: Event[] = await response.json();
      console.log('[ManageEventsPage] fetchEvents success. Data:', data);
      setEvents(data);
    } catch (err: any) {
      console.error('[ManageEventsPage] fetchEvents network/fetch error:', err);
      setError(err.message || 'An unexpected error occurred while fetching events.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    console.log('[ManageEventsPage] useEffect triggered. AuthIsLoading:', authIsLoading, 'User:', user);
    if (!authIsLoading) {
      if (!user) {
        router.push('/login?redirect=/dashboard/events');
      } else {
        console.log('[ManageEventsPage] User authenticated, calling fetchEvents. User:', user);
        fetchEvents();
      }
    }
  }, [user, authIsLoading, router, fetchEvents]);

  const handleDelete = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    if (!token) {
      alert('Authentication error. Please log in again.');
      return;
    }
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to delete event.');
      }
      alert('Event deleted successfully.');
      fetchEvents(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  console.log('[ManageEventsPage] Rendering. authIsLoading:', authIsLoading, 'local loading:', loading);
  if (authIsLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600"></div>
        <p className="ml-4 text-xl">Loading events...</p>
      </div>
    );
  }

  console.log('[ManageEventsPage] Rendering. Error state:', error);
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-red-500 bg-red-100 p-4 rounded-md">{error}</p>
        <button 
          onClick={fetchEvents}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Events</h1>
        <Link href="/dashboard/events/create"
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-gray-500 text-xl">No events found. Start by creating one!</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(event.event_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.is_published ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.user_email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/events/edit/${event.id}`}
                      className="text-sky-600 hover:text-sky-900 mr-3">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
