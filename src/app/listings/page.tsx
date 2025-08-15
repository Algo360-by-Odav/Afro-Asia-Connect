'use client';

import React, { useEffect, useState } from 'react';
import ListingCard, { BusinessListing } from '../components/listings/ListingCard';
import Link from 'next/link';

export default function ListingsPage() {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || `Failed to fetch listings: ${response.status}`);
        }
        const data: BusinessListing[] = await response.json();
        setListings(data);
      } catch (err: any) {
        console.error('Error fetching listings:', err);
        setError(err.message || 'An unexpected error occurred while fetching listings.');
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Explore Business Listings
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover a wide range of businesses connecting Africa and Asia. Find your next partner or supplier.
          </p>
        </header>

        {loading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            <p className="text-xl text-gray-700 ml-4">Loading listings...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-xl text-red-600 bg-red-100 p-4 rounded-md shadow-md">Error: {error}</p>
            <p className="mt-4 text-gray-600">Please try refreshing the page. If the problem persists, contact support.</p>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-10">
            <img src="/empty-state-listings.svg" alt="No listings found" className="mx-auto h-48 w-auto mb-6" /> 
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Listings Found</h2>
            <p className="text-gray-500 mb-6">There are currently no active business listings. Check back later or be the first to add one!</p>
            <Link href="/listings/create" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Create a Listing
            </Link>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
