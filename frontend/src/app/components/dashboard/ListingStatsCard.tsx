import React from 'react';
import { ListChecks, XCircle, Sigma, BarChart3 } from 'lucide-react';

interface ListingStats {
  activeCount: number;
  inactiveCount: number;
}

interface ListingStatsCardProps {
  stats: ListingStats | null;
  loading: boolean;
  error: string | null;
}

const ListingStatsCard: React.FC<ListingStatsCardProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/2 mb-6"></div> {/* Title skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-100 rounded-lg">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div> {/* Stat label skeleton */}
              <div className="h-6 bg-slate-200 rounded w-1/4"></div> {/* Stat value skeleton */}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
          <BarChart3 className="mr-3 text-blue-500" size={28} /> Listing Statistics
        </h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
          <BarChart3 className="mr-3 text-blue-500" size={28} /> Listing Statistics
        </h2>
        <p className="text-gray-600">No statistics available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
        <BarChart3 className="mr-3 text-blue-500" size={28} /> Listing Statistics
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg shadow-sm">
          <div className="flex items-center">
            <ListChecks className="mr-2 text-green-600" size={22} />
            <p className="text-lg font-medium text-green-700">Active Listings:</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.activeCount}</p>
        </div>
        <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg shadow-sm">
          <div className="flex items-center">
            <XCircle className="mr-2 text-red-600" size={22} />
            <p className="text-lg font-medium text-red-700">Inactive Listings:</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.inactiveCount}</p>
        </div>
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Sigma className="mr-2 text-blue-600" size={22} />
            <p className="text-lg font-medium text-blue-700">Total Listings:</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.activeCount + stats.inactiveCount}</p>
        </div>
      </div>
    </div>
  );
};

export default ListingStatsCard;
