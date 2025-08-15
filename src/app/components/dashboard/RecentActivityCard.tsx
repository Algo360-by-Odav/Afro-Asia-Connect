'use client';

import React from 'react';
import { MessageCircle, Eye, AlertCircle, TrendingUp, ListChecks } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'message' | 'view' | 'alert' | 'performance' | 'update';
  text: string;
  timestamp: Date;
  link?: string;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

const iconMap: Record<ActivityItem['type'], { icon: React.ElementType; color: string; bgColor: string }> = {
  message: { icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  view: { icon: Eye, color: 'text-green-500', bgColor: 'bg-green-100' },
  alert: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
  performance: { icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  update: { icon: ListChecks, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <TrendingUp className="mr-3 text-gray-500" size={28} /> Recent Activity
        </h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4 items-center p-2">
              <div className="rounded-full bg-slate-200 h-8 w-8"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
              </div>
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
          <TrendingUp className="mr-3 text-gray-500" size={28} /> Recent Activity
        </h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <TrendingUp className="mr-3 text-gray-500" size={28} /> Recent Activity
        </h2>
        <p className="text-gray-500">No recent activity to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
        <TrendingUp className="mr-3 text-gray-500" size={28} /> Recent Activity
      </h2>
      <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type].icon;
          const iconColor = iconMap[activity.type].color;
          const iconBgColor = iconMap[activity.type].bgColor;
          return (
            <li key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md">
              <div className={`p-2 rounded-full ${iconBgColor}`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  {activity.link ? (
                    <a href={activity.link} className="hover:underline text-blue-600 hover:text-blue-800">
                      {activity.text}
                    </a>
                  ) : (
                    activity.text
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentActivityCard;
