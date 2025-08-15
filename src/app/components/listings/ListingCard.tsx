/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import Link from 'next/link';

export interface BusinessListing {
  id: string | number; // Assuming ID can be number or string (UUID)
  user_id: string | number;
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
  created_at: string; // Date string
  updated_at: string; // Date string
}

interface ListingCardProps {
  listing: BusinessListing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const defaultLogo = '/logo-placeholder.svg'; // A default placeholder if no logo

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out border border-gray-200">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
          <img 
            src={listing.logo_image_url || defaultLogo} 
            alt={`${listing.business_name} logo`} 
            className="w-full h-full object-contain p-2" // Changed to object-contain to see full logo
            onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }} // Fallback for broken image links
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-indigo-700 mb-2 truncate" title={listing.business_name}>
            {listing.business_name}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Category:</span> {listing.business_category}
          </p>
          {listing.country_of_origin && (
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Origin:</span> {listing.country_of_origin}
            </p>
          )}
          {listing.target_markets && listing.target_markets.length > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Targets:</span> {listing.target_markets.join(', ')}
            </p>
          )}
          <p className="text-gray-700 text-sm mb-4 h-16 overflow-hidden text-ellipsis">
            {listing.description ? listing.description.substring(0, 100) + (listing.description.length > 100 ? '...' : '') : 'No description available.'}
          </p>
          <div className="text-center mt-4">
            <span className="inline-block bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-200">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ListingCard;
