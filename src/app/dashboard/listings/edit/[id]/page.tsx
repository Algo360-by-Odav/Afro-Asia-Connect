/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ListingFormState {
  business_name: string;
  business_category: string;
  description: string;
  country_of_origin: string;
  target_markets: string[];
  contact_email: string;
  contact_phone: string;
  website_url: string;
  logo_image_url: string;
  gallery_image_urls: string[];
  // Add other fields from your schema that you want to edit
}

interface ListingData {
  id: number;
  userId: number;
  businessName: string;
  businessCategory: string;
  description: string;
  countryOfOrigin: string;
  targetMarkets: string[];
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  logoImageUrl: string;
  galleryImageUrls: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const EditListingPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<ListingFormState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (id && token) {
      const fetchListing = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://127.0.0.1:3001/api/listings/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to fetch listing: ${response.status}`);
          }
          const data: ListingData = await response.json();
          setListing({
            business_name: data.businessName || '',
            business_category: data.businessCategory || '',
            description: data.description || '',
            country_of_origin: data.countryOfOrigin || '',
            target_markets: data.targetMarkets || [],
            contact_email: data.contactEmail || '',
            contact_phone: data.contactPhone || '',
            website_url: data.websiteUrl || '',
            logo_image_url: data.logoImageUrl || '',
            gallery_image_urls: data.galleryImageUrls || [],
          });
        } catch (err: any) {
          console.error('Fetch listing error:', err);
          setError(err.message || 'An unknown error occurred while fetching the listing.');
        }
        setLoading(false);
      };
      fetchListing();
    }
  }, [id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!listing) return;
    const { name, value } = e.target;
    // For array fields like target_markets, you might need special handling if using a multi-select or comma-separated input
    if (name === 'target_markets' || name === 'gallery_image_urls') {
      setListing({ ...listing, [name]: value.split(',').map(item => item.trim()).filter(item => item) });
    } else {
      setListing({ ...listing, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listing || !id || !token) {
      setSubmitError('Form data or authentication token is missing.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listing),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to update listing: ${response.status}`);
      }
      // Optionally, show a success message before redirecting
      alert('Listing updated successfully!');
      router.push('/dashboard/listings'); // Redirect to the main listings page
    } catch (err: any) {
      console.error('Update listing error:', err);
      setSubmitError(err.message || 'An unknown error occurred while updating the listing.');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading listing details...</p></div>;
  if (error) return <div className="flex flex-col justify-center items-center h-screen"><p className="text-red-500 text-lg">Error: {error}</p><Link href="/dashboard/listings" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Back to Listings</Link></div>;
  if (!listing) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Listing not found or unable to load.</p></div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Edit Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 shadow-lg rounded-lg">
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input type="text" name="business_name" id="business_name" value={listing.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="business_category" className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
          <input type="text" name="business_category" id="business_category" value={listing.business_category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" id="description" value={listing.description} onChange={handleChange} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label htmlFor="country_of_origin" className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
          <input type="text" name="country_of_origin" id="country_of_origin" value={listing.country_of_origin} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        {/* Add more fields here as needed, e.g., contact_email, target_markets etc. */}
        {/* Example for contact_email */}
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input type="email" name="contact_email" id="contact_email" value={listing.contact_email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        {/* Example for target_markets (comma-separated string for simplicity) */}
        <div>
          <label htmlFor="target_markets" className="block text-sm font-medium text-gray-700 mb-1">Target Markets (comma-separated)</label>
          <input type="text" name="target_markets" id="target_markets" value={listing.target_markets.join(', ')} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Link href="/dashboard/listings" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListingPage;
