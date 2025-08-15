'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { toast } from 'react-toastify';
import ListingCardSkeleton from '../../components/listings/ListingCardSkeleton';
import ListingCard from '../../components/listings/ListingCard';

const LISTINGS_PER_PAGE = 6; // Adjusted for better layout with skeletons

const businessCategories = [
  'Textiles & Apparel',
  'Electronics & Electrical Goods',
  'Agriculture & Food Products',
  'Machinery & Industrial Supplies',
  'Automotive Parts & Vehicles',
  'Home Goods & Furniture',
  'Beauty & Personal Care',
  'Construction & Real Estate',
  'Services (Consulting, IT, etc.)',
  'Other'
];

interface Listing {
  id: number;
  user_id: number;
  business_name: string;
  business_category: string;
  description: string | null;
  country_of_origin: string | null;
  target_markets: string[] | null;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  logo_image_url: string | null;
  gallery_image_urls: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ListingsResponse {
  listings: Listing[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function MyListingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [dataLoading, setDataLoading] = useState(true); // For data fetching
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('DESC');

  const fetchListings = useCallback(async (page: number, category: string, sort: string, order: string) => {
    if (!user) {
      setError('You must be logged in to view your listings.');
      setDataLoading(false);
      setListings([]);
      setTotalPages(0);
      return;
    }

    setDataLoading(true);
    setError(null);
    try {
      let apiUrl = `/api/listings/my-listings?page=${page}&limit=${LISTINGS_PER_PAGE}`;
      if (category) {
        apiUrl += `&category=${encodeURIComponent(category)}`;
      }
      apiUrl += `&sortBy=${sort}&sortOrder=${order}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch listings.' }));
        throw new Error(errorData.msg || `Failed to fetch listings. Status: ${response.status}`);
      }
      const data: ListingsResponse = await response.json();
      setListings(data.listings);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setListings([]);
      setTotalPages(0);
    } finally {
      setDataLoading(false);
    }
  }, [user]); // Added user to useCallback dependencies

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('Please log in to view your listings.');
      setDataLoading(false);
      setListings([]); // Clear listings if user logs out
      setTotalPages(0);
      return;
    }
    fetchListings(currentPage, selectedCategory, sortBy, sortOrder);
  }, [user, authLoading, currentPage, selectedCategory, sortBy, sortOrder, fetchListings]);

  const handleDelete = async (listingId: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.msg || 'Failed to delete listing.');
      
      toast.success('Listing deleted successfully!');
      // Refetch logic: if last item on a page (and not page 1), go to prev page, else refetch current.
      if (listings.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1); // useEffect will refetch
      } else {
        fetchListings(currentPage, selectedCategory, sortBy, sortOrder); // Or refetch current page
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Failed to delete listing.'}`);
      console.error('Delete error:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
    setCurrentPage(1); // Reset to page 1
  };

  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value);
    setCurrentPage(1); // Reset to page 1
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1); // Reset to page 1
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="text-xl text-gray-700 ml-4">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
          <p className="text-red-500 mb-6">You must be logged in to view this page.</p>
          <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  // Main content once authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-6 bg-white shadow-md rounded-lg flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category:</label>
            <select id="category-filter" value={selectedCategory} onChange={handleCategoryChange} className="mt-1 block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
              <option value="">All Categories</option>
              {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
              <select id="sort-by" value={sortBy} onChange={handleSortChange} className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
                <option value="created_at">Date Created</option>
                <option value="business_name">Business Name</option>
                <option value="updated_at">Last Updated</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Order:</label>
              <select id="sort-order" value={sortOrder} onChange={handleOrderChange} className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
                <option value="DESC">Descending</option>
                <option value="ASC">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">My Business Listings</h1>
          <Link href="/listings/create" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150">Create New Listing</Link>
        </header>

                {

          error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          ) ||
          (dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: LISTINGS_PER_PAGE }).map((_, index) => <ListingCardSkeleton key={index} />)}
            </div>
          ) : !error && listings.length === 0 ? (
            <div className="text-center py-10 bg-white shadow-lg rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">No listings found</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedCategory ? `No listings found for "${selectedCategory}".` : 'Get started by creating a new listing.'}</p>
              <div className="mt-6"><Link href="/listings/create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Create New Listing</Link></div>
            </div>
          ) : !error && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null)
        }

      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
