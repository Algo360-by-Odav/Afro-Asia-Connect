'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Edit3, Trash2, ToggleLeft, ToggleRight, PlusCircle } from 'lucide-react';

interface Listing {
  id: string;
  businessName: string;
  businessCategory: string;
  isActive: boolean;
  // Add other relevant fields from your backend listing structure
  // e.g., countryOfOrigin, createdAt, logoImageUrl
}

interface FetchListingsResponse {
  listings: Listing[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function ManageListingsPage() {
  const { user, token, isLoading: authLoading, fetchUser } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalCount, setTotalCount] = useState(0); // If needed for display

  const fetchListings = useCallback(async (page = 1) => {
    // Check both user_type and role fields for compatibility - prioritize role field
    const userRole = user?.role || user?.user_type;
    
    // Normalize role check to handle case variations
    const normalizedRole = userRole ? userRole.toString().toUpperCase() : '';
    const isSellerRole = normalizedRole === 'SELLER' || normalizedRole === 'SUPPLIER' || normalizedRole === 'SERVICE_PROVIDER';
    
    console.log('DEBUG fetchListings - user:', user);
    console.log('DEBUG fetchListings - userRole:', userRole);
    console.log('DEBUG fetchListings - normalizedRole:', normalizedRole);
    console.log('DEBUG fetchListings - isSellerRole:', isSellerRole);
    console.log('DEBUG fetchListings - token:', token ? 'present' : 'missing');
    
    if (!user || !isSellerRole || !token) {
      console.log('DEBUG fetchListings - access denied, userRole:', userRole);
      setError('Access Denied: You must be a seller to manage listings.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/listings/my-listings?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch listings.'}));
        throw new Error(errorData.message || 'Failed to fetch listings');
      }
      const data: FetchListingsResponse = await response.json();
      setListings(data.listings);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      // setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading) {
        // Check both user_type and role fields for compatibility - prioritize role field
        const userRole = user?.role || user?.user_type;
        const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER' || userRole === 'supplier';
        
        // If user has customer role but email suggests seller, try to refresh user data
        if (userRole === 'customer' && user?.email === 'testseller123@gmail.com') {
          console.log('🔄 Detected testseller123@gmail.com with customer role, attempting to refresh user data...');
          fetchUser(); // This should fetch fresh data from backend
          return; // Exit early to avoid showing access denied
        }
        console.log('DEBUG useEffect - user:', user);
        console.log('DEBUG useEffect - userRole:', userRole);
        console.log('DEBUG useEffect - isSellerRole:', isSellerRole);
        if (user && isSellerRole) {
            fetchListings(currentPage);
        } else if (user && !isSellerRole) {
            setError(`Access Denied: This page is for sellers only. Current role: ${userRole}`);
            setIsLoading(false);
        } else {
            // Not logged in, or user object not yet available but auth not loading
            // Middleware should handle redirect to login if not authenticated
            setIsLoading(false); 
        }
    }
  }, [authLoading, user, fetchListings, currentPage]);

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete listing.');
      // Refresh listings
      fetchListings(currentPage);
      alert('Listing deleted successfully.');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const toggleListingStatus = async (listing: Listing) => {
    if (!token) return;
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !listing.isActive }),
      });
      if (!response.ok) throw new Error('Failed to update listing status.');
      // Refresh listings
      fetchListings(currentPage);
      alert('Listing status updated.');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };
  
  if (authLoading || isLoading) {
    return <div className="p-6 text-center"><p>Loading listings...</p></div>;
  }

  // Check both user_type and role fields for compatibility - prioritize role field
  const userRole = user?.role || user?.user_type;
  const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER' || userRole === 'supplier';
  console.log('DEBUG render - user object:', JSON.stringify(user, null, 2));
  console.log('DEBUG render - userRole:', userRole);
  if (!user || authLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!user || !isSellerRole || !token) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
        <p className="mt-4 text-slate-600">You must be a seller to manage listings.</p>
        <p className="mt-2 text-sm text-gray-500">Current user role: {userRole}</p>
        <p className="mt-1 text-sm text-gray-500">User object: {JSON.stringify(user)}</p>
        
        <div className="mt-6 space-x-2">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/update-role', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ role: 'seller' })
                });
                
                if (response.ok) {
                  await fetchUser(); // Refresh user data
                  window.location.reload(); // Reload page to reflect changes
                } else {
                  alert('Failed to update role');
                }
              } catch (error) {
                console.error('Error updating role:', error);
                alert('Error updating role');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Become a Seller
          </button>
          
          <button 
            onClick={fetchUser}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Refresh User Data
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            Clear Cache & Reload
          </button>
          
          <Link href="/dashboard" className="inline-block px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-600"><p>Error: {error}</p></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Manage Your Listings</h1>
        <Link href="/dashboard/listings/create" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150">
          <PlusCircle size={20} className="mr-2" /> Create New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-10">
            <p className="text-slate-600 text-lg">You haven't created any listings yet.</p>
            <Link href="/dashboard/listings/create" className="mt-4 inline-block px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Create Your First Listing
            </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{listing.businessName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{listing.businessCategory}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => router.push(`/listings/${listing.id}`)} title="View Public Page" className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                    <button onClick={() => router.push(`/dashboard/listings/edit/${listing.id}`)} title="Edit Listing" className="text-yellow-600 hover:text-yellow-800"><Edit3 size={18} /></button>
                    <button onClick={() => toggleListingStatus(listing)} title={listing.isActive ? 'Deactivate' : 'Activate'} className={`hover:text-slate-700 ${listing.isActive ? 'text-gray-500' : 'text-green-600'}`}>
                      {listing.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => handleDelete(listing.id)} title="Delete Listing" className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination Controls */} 
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button 
            onClick={() => fetchListings(currentPage - 1)} 
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-700">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => fetchListings(currentPage + 1)} 
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
