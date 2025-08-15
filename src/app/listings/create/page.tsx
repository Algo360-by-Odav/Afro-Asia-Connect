'use client';

import React from 'react';
import CreateListingForm from '../../components/listings/CreateListingForm';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreateListingPage() {
  const { user, isLoading, token } = useAuth();
  console.log('--- DEBUG CreateListingPage: user from useAuth():', JSON.stringify(user, null, 2));
  console.log('--- DEBUG CreateListingPage: user_type from useAuth():', user?.user_type);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not loading, no token, and not already on login page
    if (!isLoading && !token && !window.location.pathname.startsWith('/login')) {
      router.push('/login?redirect=/listings/create');
    }
    // The main access denial or form rendering is handled by the return statement below based on user state after loading.
  }, [token, isLoading, router]); // Removed user from dependency array to avoid loop if router.push changes user

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="text-xl text-gray-700 ml-4">Loading...</p>
      </div>
    );
  }

  // After loading is complete:
  if (!user) {
    // If still no user after loading (verifyAuth failed or no session), show access denied / prompt to log in.
    // This case should ideally be caught by middleware or the useEffect redirect to /login if no token.
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">You must be logged in to access this page. Please log in.</p>
        <button 
          onClick={() => router.push('/login?redirect=/listings/create')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150"
        >
          Log In
        </button>
      </div>
    );
  }

  if (user.user_type !== 'seller') {
    // User is logged in, but not a seller.
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">Only sellers can create listings. Your account type is: {user.user_type}.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-150 mr-2"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => router.push('/contact-support')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150"
        >
          Contact Support
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Create a New Business Listing
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Showcase your business to potential partners across Afro-Asia.
          </p>
        </header>
        <CreateListingForm />
      </div>
    </div>
  );
}
