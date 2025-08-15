'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Zap, Eye } from 'lucide-react';

interface FeaturedListingItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  price?: string; // Optional price
  origin?: string; // Optional country of origin
}

interface FeaturedListingsCardProps {
  listings: FeaturedListingItem[];
  title?: string;
  loading: boolean;
  error: string | null;
}

const FeaturedListingsCard: React.FC<FeaturedListingsCardProps> = ({ listings, title = "Featured Listings", loading, error }) => {
  const defaultImage = '/image-placeholder.svg'; // Provide a default placeholder image

  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <Star className="mr-3 text-yellow-500" size={28} /> {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-3">
              <div className="bg-slate-200 h-32 rounded-md mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <Star className="mr-3 text-yellow-500" size={28} /> {title}
        </h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <Star className="mr-3 text-yellow-500" size={28} /> {title}
        </h2>
        <div className="text-center py-6">
          <Zap size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No featured listings available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
        <Star className="mr-3 text-yellow-500" size={28} /> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        {listings.slice(0, 4).map((listing) => (
          <Link href={`/listings/${listing.id}`} key={listing.id} className="block group">
            <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="relative w-full h-40 bg-gray-100">
                <Image 
                  src={listing.imageUrl || defaultImage} 
                  alt={listing.name} 
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-md font-semibold text-indigo-700 truncate group-hover:text-indigo-800" title={listing.name}>
                  {listing.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{listing.category}</p>
                {listing.origin && <p className="text-xs text-gray-500">From: {listing.origin}</p>}
                {listing.price && <p className="text-sm font-medium text-green-600 mt-1">{listing.price}</p>}
                <button className="mt-3 w-full text-xs flex items-center justify-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors">
                  <Eye size={14} className="mr-1.5" /> View Details
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedListingsCard;
