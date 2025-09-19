/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Define the structure for individual products within products_info
interface ProductDetail {
  name: string;
  images: string[];
  specifications: string;
  moq: string;
}

// Define the detailed listing interface
interface DetailedBusinessListing {
  id: string | number;
  userId: string | number;
  businessName: string;
  businessCategory: string;
  subsector?: string;
  description: string | null;
  companyOverview?: string;
  countryOfOrigin: string | null;
  targetMarkets: string[] | null;
  contactEmail: string;
  contactPhone: string | null;
  websiteUrl: string | null;
  logoImageUrl: string | null;
  galleryImageUrls: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  languagesSpoken?: string[];
  isVerified?: boolean;
  productsInfo?: ProductDetail[];
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

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<DetailedBusinessListing | null>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Listing ID is missing.');
      setLoading(false);
      return;
    }

    const fetchListingDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`);
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
        console.log('Listing data received:', data);
        console.log('Gallery URLs:', data.galleryImageUrls);
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
              src={listing.logoImageUrl || defaultLogo} 
              alt={`${listing.businessName} logo`} 
              onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
            />
          </div>
          <div className="p-8 md:w-1/2">
            <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">{listing.businessCategory}</div>
            <h1 className="block mt-1 text-3xl leading-tight font-bold text-black hover:underline">
                {listing.businessName}
                {listing.isVerified && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full align-middle">
                    Verified
                  </span>
                )}
              </h1>
            {listing.countryOfOrigin && (
                <p className="mt-2 text-gray-500"><span className="font-medium text-gray-700">From:</span> {listing.countryOfOrigin}</p>
            )}
          </div>
        </div>
        
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Business Details</h2>
          <div className="space-y-3 text-gray-700">
            {listing.description && <p><span className="font-semibold">Company Overview:</span> {listing.description}</p>}
            {listing.targetMarkets && listing.targetMarkets.length > 0 && (
              <p><span className="font-semibold">Target Markets:</span> {listing.targetMarkets.join(', ')}</p>
            )}
            {listing.subsector && (
              <p><span className="font-semibold">Sector/Subsector:</span> {listing.businessCategory} / {listing.subsector}</p>
            )}
            {listing.languagesSpoken && listing.languagesSpoken.length > 0 && (
              <p><span className="font-semibold">Languages Spoken:</span> {listing.languagesSpoken.join(', ')}</p>
            )}
            {user ? (
              <>
                <p><span className="font-semibold">Contact Email:</span> <a href={`mailto:${listing.contactEmail}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">{listing.contactEmail}</a></p>
                {listing.contactPhone && <p><span className="font-semibold">Contact Phone:</span> {listing.contactPhone}</p>}
              </>
            ) : (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                <p className="text-sm text-yellow-700">
                  <Link href={`/login?redirect=/listings/${id}`} className="font-semibold text-indigo-600 hover:underline">Log in</Link> or <Link href={`/signup?redirect=/listings/${id}`} className="font-semibold text-indigo-600 hover:underline">sign up</Link> to view contact details.
                </p>
              </div>
            )}
            {listing.websiteUrl && (
              <p><span className="font-semibold">Website:</span> <a href={listing.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">{listing.websiteUrl}</a></p>
            )}
            <p><span className="font-semibold">Listing Active Since:</span> {formatDate(listing.createdAt)}</p>
            <p><span className="font-semibold">Last Updated:</span> {formatDate(listing.updatedAt)}</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Products</h2>
          {listing.productsInfo && listing.productsInfo.length > 0 ? (
            <div className="space-y-8">
              {listing.productsInfo.map((product, index) => (
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
          {listing.galleryImageUrls && Array.isArray(listing.galleryImageUrls) && listing.galleryImageUrls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listing.galleryImageUrls.filter(url => url && url.trim() !== '').map((url, index) => (
                <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={url} 
                    alt={`Gallery image ${index + 1}`} 
                    className="object-cover w-full h-full" 
                    onError={(e) => { 
                      console.error('Failed to load gallery image:', url);
                      (e.target as HTMLImageElement).src = defaultLogo; 
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No gallery images have been uploaded for this business yet.</p>
          )}
        </div>

        <div className="px-8 py-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Listing created on: {formatDate(listing.createdAt)}
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {formatDate(listing.updatedAt)}
          </p>
          <Link href="/listings"
            className="mt-6 inline-block px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow hover:bg-gray-300 transition duration-150 ease-in-out">
            Back to All Listings
          </Link>
        </div>

      </div>
    </div>
  );
}
