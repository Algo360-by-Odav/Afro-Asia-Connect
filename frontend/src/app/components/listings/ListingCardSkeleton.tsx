import React from 'react';

const ListingCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300"></div> {/* Image placeholder */}
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div> {/* Title placeholder */}
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div> {/* Category placeholder */}
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div> {/* Description line 1 */}
        <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div> {/* Description line 2 */}
        
        <div className="flex justify-between items-center mt-6">
          <div className="h-10 bg-gray-300 rounded w-24"></div> {/* Button placeholder */}
          <div className="h-10 bg-gray-300 rounded w-24"></div> {/* Button placeholder */}
        </div>
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
