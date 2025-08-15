import React from 'react';
import { UserCircle, Edit3 } from 'lucide-react';

interface User {
  email: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  // Add other user fields as needed
}

interface UserProfileCardProps {
  user: User | null;
  loading: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 border border-gray-200 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/3 mb-6"></div> {/* Title skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-slate-200 rounded w-1/4 mb-1.5"></div> {/* Label skeleton */}
              <div className="h-5 bg-slate-200 rounded w-3/4"></div> {/* Value skeleton */}
            </div>
          ))}
        </div>
        <div className="mt-8 text-right">
          <div className="h-10 bg-slate-200 rounded w-28 inline-block"></div> {/* Button skeleton */}
        </div>
      </div>
    );
  }

  if (!user) {
    // This case should ideally not be hit if loading is handled correctly,
    // but as a fallback:
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <UserCircle className="mr-3 text-gray-500" size={28} /> Your Profile
        </h2>
        <p className="text-gray-600">User data is not available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
        <UserCircle className="mr-3 text-gray-500" size={28} /> Your Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="text-sm text-gray-500">First Name</p>
          <p className="text-lg text-gray-900 font-medium">{user.first_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Name</p>
          <p className="text-lg text-gray-900 font-medium">{user.last_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email Address</p>
          <p className="text-lg text-gray-900 font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Account Type</p>
          <p className="text-lg text-gray-900 font-medium">{user.user_type}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Verification Status</p>
          <p className={`text-lg font-medium ${user.is_verified ? 'text-green-600' : 'text-red-600'}`}>
            {user.is_verified ? 'Verified' : 'Not Verified'}
          </p>
        </div>
      </div>
      {/* Placeholder for profile edit button or link */}
      <div className="mt-8 text-right">
        <button 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => alert('Edit profile functionality to be implemented.')}
        >
          <Edit3 size={18} className="mr-2" /> Edit Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfileCard;
