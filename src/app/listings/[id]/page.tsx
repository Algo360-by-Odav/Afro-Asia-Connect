/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { useParams, useRouter } from 'next/navigation';
// We will define a more detailed interface for this page
// import { BusinessListing } from '../../components/listings/ListingCard'; // Original interface
import Link from 'next/link';

export async function generateStaticParams() {
  // Return empty array for static export - pages will be generated on demand
  return [];
}

// Define the structure for individual products within products_info
interface ProductDetail {
  name: string;
  images: string[];
  specifications: string; // Could be a structured object/string
  moq: string; // Minimum Order Quantity
}

// Define the detailed listing interface
interface DetailedBusinessListing {
  id: string | number;
  user_id: string | number;
  business_name: string;
  business_category: string;
  subsector?: string; // New
  description: string | null;
  company_overview?: string; // Potentially a longer version of description or a new field
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
  languages_spoken?: string[]; // New
  is_verified?: boolean; // New
  products_info?: ProductDetail[]; // New
}

// Helper function to format date string
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export default function SingleListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string; // Get ID from URL parameters

  const [listing, setListing] = useState<DetailedBusinessListing | null>(null);
  const { user } = useAuth(); // Get authenticated user from context
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      // This case should ideally be handled by Next.js routing if id is missing
      // or redirect to a 404 page
      setError('Listing ID is missing.');
      setLoading(false);
      return;
    }

    const fetchListingDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:3001/api/listings/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) {
            throw new Error(errorData.msg || 'Listing not found.');
          } else if (response.status === 400) {
            throw new Error(errorData.msg || 'Invalid listing ID format.');
          }
          throw new Error(errorData.msg || `Failed to fetch listing: ${response.status}`);
        }
        const data: DetailedBusinessListing = await response.json();
        setListing(data);
      } catch (err: any) {
        console.error(`Error fetching listing ${id}:`, err);
        setError(err.message || 'An unexpected error occurred.');
      }
      setLoading(false);
    };

    fetchListingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-2xl text-gray-700 ml-6">Loading listing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-6 text-center">
        <img src="/error-icon.svg" alt="Error" className="h-24 w-24 mb-6 text-red-500" />
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Oops! Something went wrong.</h1>
        <p className="text-xl text-gray-700 mb-6">{error}</p>
        <Link href="/listings"
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out">
          Back to Listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    // This state should ideally not be reached if error handling is robust, but as a fallback:
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-6 text-center">
        <h1 className="text-3xl font-semibold text-gray-700">Listing Not Found</h1>
        <p className="text-xl text-gray-500 mt-2 mb-6">The listing you are looking for does not exist or may have been removed.</p>
        <Link href="/listings"
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out">
          Back to Listings
        </Link>
      </div>
    );
  }
  
  const defaultLogo = '/logo-placeholder.svg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/2 bg-gray-100 flex items-center justify-center p-6">
            <img 
              className="h-64 w-auto object-contain rounded-lg shadow-md"
              src={listing.logo_image_url || defaultLogo} 
              alt={`${listing.business_name} logo`} 
              onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
            />
          </div>
          <div className="p-8 md:w-1/2">
            <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">{listing.business_category}</div>
            <h1 className="block mt-1 text-3xl leading-tight font-bold text-black hover:underline">
                {listing.business_name}
                {listing.is_verified && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full align-middle">
                    Verified
                  </span>
                )}
              </h1>
            {listing.country_of_origin && (
                <p className="mt-2 text-gray-500"><span className="font-medium text-gray-700">From:</span> {listing.country_of_origin}</p>
            )}
          </div>
        </div>
        
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Business Details</h2>
          <div className="space-y-3 text-gray-700">
            {listing.description && <p><span className="font-semibold">Company Overview:</span> {listing.description}</p>}
            {listing.target_markets && listing.target_markets.length > 0 && (
              <p><span className="font-semibold">Target Markets:</span> {listing.target_markets.join(', ')}</p>
            )}
            {listing.subsector && (
              <p><span className="font-semibold">Sector/Subsector:</span> {listing.business_category} / {listing.subsector}</p>
            )}
            {listing.languages_spoken && listing.languages_spoken.length > 0 && (
              <p><span className="font-semibold">Languages Spoken:</span> {listing.languages_spoken.join(', ')}</p>
            )}
            {user ? (
              <>
                <p><span className="font-semibold">Contact Email:</span> <a href={`mailto:${listing.contact_email}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">{listing.contact_email}</a></p>
                {listing.contact_phone && <p><span className="font-semibold">Contact Phone:</span> {listing.contact_phone}</p>}
              </>
            ) : (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                <p className="text-sm text-yellow-700">
                  <Link href={`/login?redirect=/listings/${id}`} className="font-semibold text-indigo-600 hover:underline">Log in</Link> or <Link href={`/signup?redirect=/listings/${id}`} className="font-semibold text-indigo-600 hover:underline">sign up</Link> to view contact details.
                </p>
              </div>
            )}
            {listing.website_url && (
              <p><span className="font-semibold">Website:</span> <a href={listing.website_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">{listing.website_url}</a></p>
            )}
            <p><span className="font-semibold">Listing Active Since:</span> {formatDate(listing.created_at)}</p>
            <p><span className="font-semibold">Last Updated:</span> {formatDate(listing.updated_at)}</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Products</h2>
          {listing.products_info && listing.products_info.length > 0 ? (
            <div className="space-y-8">
              {listing.products_info.map((product, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-xl font-semibold text-indigo-700 mb-3">{product.name}</h3>
                  {product.images && product.images.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {product.images.map((imgUrl, imgIndex) => (
                        <img 
                          key={imgIndex} 
                          src={imgUrl || defaultLogo} 
                          alt={`${product.name} image ${imgIndex + 1}`} 
                          className="rounded-md object-cover h-40 w-full shadow-sm" 
                          onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
                        />
                      ))}
                    </div>
                  )}
                  {product.specifications && (
                    <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-800">Specifications:</span> {product.specifications}</p>
                  )}
                  {product.moq && (
                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Minimum Order Quantity (MOQ):</span> {product.moq}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No products have been listed for this business yet.</p>
          )}
        </div>
        
        {/* Gallery Section */}
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gallery</h2>
          {listing.gallery_image_urls && listing.gallery_image_urls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listing.gallery_image_urls.map((url, index) => (
                <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-md">
                  <img src={url || defaultLogo} alt={`Gallery image ${index + 1}`} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}/>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No gallery images have been uploaded for this business yet.</p>
          )}
        </div>

        <div className="px-8 py-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Listing created on: {formatDate(listing.created_at)}
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {formatDate(listing.updated_at)}
          </p>
          <Link href="/listings"
            className="mt-6 inline-block px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow hover:bg-gray-300 transition duration-150 ease-in-out">
            Back to All Listings
          </Link>
        </div>

      </div>
    </div>
  );
};
