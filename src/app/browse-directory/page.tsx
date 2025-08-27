"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BusinessListing {
  id: string | number;
  business_name: string;
  business_category: string;
  country_of_origin: string;
  target_markets?: string; // e.g., "Asia", "Africa, Europe"
  logo_image_url?: string;
  // Add other relevant fields from your API response
}

const PREDEFINED_CATEGORIES = ['All', 'Electronics & Electrical Goods', 'Agriculture', 'Manufacturing', 'Technology', 'Services', 'Consulting', 'Real Estate']; // TODO: Populate dynamically
const TARGET_MARKETS_OPTIONS = ['All', 'Asia', 'Africa', 'Europe'];

export default function BrowseDirectoryPage() {
  const [allListings, setAllListings] = useState<BusinessListing[]>([]); // Store all fetched listings
  const [filteredListings, setFilteredListings] = useState<BusinessListing[]>([]); // Listings to display after filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uniqueCountries, setUniqueCountries] = useState<string[]>(['All']);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedTargetMarket, setSelectedTargetMarket] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Show 6 listings per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch('http://127.0.0.1:3001/api/listings');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllListings(data);
        setFilteredListings(data); // Initially, all listings are shown
        // Extract unique countries for the filter dropdown
        const countries = Array.from(
          new Set(data.map((item: BusinessListing) => item.country_of_origin).filter(Boolean) as string[])
        );
        setUniqueCountries(['All', ...countries.sort()]);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  // Effect for filtering
  useEffect(() => {
    let currentListings = [...allListings];

    // Filter by search term (business name)
    if (searchTerm) {
      currentListings = currentListings.filter(listing =>
        listing.business_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      currentListings = currentListings.filter(listing =>
        listing.business_category === selectedCategory
      );
    }

        // Filter by Country of Origin
    if (selectedCountry && selectedCountry !== 'All') {
      currentListings = currentListings.filter(listing =>
        listing.country_of_origin === selectedCountry
      );
    }

    // Filter by Target Market
    if (selectedTargetMarket && selectedTargetMarket !== 'All') {
      currentListings = currentListings.filter(listing =>
        listing.target_markets && listing.target_markets.includes(selectedTargetMarket)
      );
    }

    setFilteredListings(currentListings);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory, selectedCountry, selectedTargetMarket, allListings]);

  // Calculate items for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredListings.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Browse Our Directory
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Discover businesses, services, and opportunities across Africa and Asia.
          </p>
        </header>

        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Search and Filter Section */}
          <div className="mb-8 p-6 bg-sky-50 rounded-md border border-sky-200">
            <h2 className="text-2xl font-semibold text-sky-800 mb-4">Search & Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
                <input
                  type="text"
                  id="searchTerm"
                  placeholder="Enter business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                <select
                  id="categoryFilter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {PREDEFINED_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                <select
                  id="countryFilter"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="targetMarketFilter" className="block text-sm font-medium text-gray-700 mb-1">Target Market</label>
                <select
                  id="targetMarketFilter"
                  value={selectedTargetMarket}
                  onChange={(e) => setSelectedTargetMarket(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {TARGET_MARKETS_OPTIONS.map(market => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Listings</h2>
            {loading && <p className="text-center text-gray-600">Loading listings...</p>}
            {error && <p className="text-center text-red-600">Error fetching listings: {error}</p>}
            {!loading && !error && filteredListings.length === 0 && (
              <p className="text-center text-gray-600">No listings found.</p>
            )}
            {!loading && !error && filteredListings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ... rest of the rendering logic for currentItems ... */}
            {currentItems.map((listing: BusinessListing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                    <div className="w-full h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                      {listing.logo_image_url ? (
                        <img src={listing.logo_image_url} alt={`${listing.business_name} logo`} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-gray-400 text-sm">No Logo Available</span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-sky-700 mb-2 truncate" title={listing.business_name}>{listing.business_name}</h3>
                    <p className="text-sm text-gray-600 mb-1">Sector: {listing.business_category || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-1">Origin: {listing.country_of_origin || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-3">Targets: {listing.target_markets || 'N/A'}</p>
                    <div className="mt-auto">
                      <Link href={`/listings/${listing.id}`} className="text-sky-600 hover:text-sky-800 font-medium text-sm">
                        View Profile &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && !error && filteredListings.length > itemsPerPage && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(filteredListings.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredListings.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredListings.length / itemsPerPage)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} AfroAsiaConnect. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
