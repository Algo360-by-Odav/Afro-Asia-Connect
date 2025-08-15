import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle2, MailOpen, Bell } from 'lucide-react';
import { formatDistanceToNowStrict, format, isToday, isYesterday } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead?: boolean;
}

interface NotificationsCardProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  token: string | null; // Added token prop
}

const iconMap = {
  info: { icon: Info, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  success: { icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100' },
  warning: { icon: AlertTriangle, color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  error: { icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100' },
} as const;

type IconType = keyof typeof iconMap;

const getIconData = (rawType: string) => {
  const key = rawType.toLowerCase() as IconType;
  return iconMap[key] ?? iconMap.info;
};

const NotificationsCard: React.FC<NotificationsCardProps> = ({ notifications: initialNotifications, loading, error, token }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const handleMarkAsRead = async (id: string) => {
    if (!token) {
      console.error('No token available, cannot mark notification as read.');
      // Optionally, show an error to the user
      return;
    }
    try {
      const response = await fetch(`/api/notifications/${id}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to mark notification as read:', response.status, errorData);
        // Optionally, show an error to the user (e.g., using a toast notification)
        return; // Don't update UI if backend update failed
      }

      // If API call is successful, then update the local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error calling mark-read API:', err);
      // Optionally, show an error to the user
    }
  };

  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (isToday(date)) {
      return formatDistanceToNowStrict(date, { addSuffix: true });
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'p')}`;
    }
    try {
      return format(date, 'MMM d, yyyy HH:mm');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <Bell className="mr-3 text-gray-500" size={28} /> Notifications
        </h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4 items-center p-3">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="h-2 bg-slate-200 rounded w-3/4"></div>
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
         <Bell className="mr-3 text-gray-500" size={28} /> Notifications
        </h2>
        <div className="flex flex-col items-center justify-center py-8">
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-red-600 font-medium">Error loading notifications:</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
          <Bell className="mr-3 text-gray-500" size={28} /> Notifications
        </h2>
        <div className="flex flex-col items-center justify-center py-8">
          <Bell className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-600">No new notifications.</p>
          <p className="text-sm text-gray-400">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center">
        <Bell className="mr-3 text-gray-500" size={28} /> Notifications
      </h2>
      <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {notifications.map((notification) => {
          const { icon: IconComponent, color: iconColor, bgColor: iconBgColor } = getIconData(notification.type as string);
          
          return (
            <li 
              key={notification.id} 
              className={`flex items-start p-4 rounded-lg transition-all duration-200 ease-in-out ${notification.isRead ? 'bg-gray-50 opacity-70 hover:bg-gray-100' : `${iconBgColor} hover:shadow-md`}`}
            >
              <div className={`mr-3 p-2 rounded-full ${notification.isRead ? 'bg-gray-200' : iconBgColor.replace('100', '200') }`}>
                <IconComponent className={`${iconColor} w-5 h-5`} />
              </div>
              <div className="flex-grow">
                <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{notification.message}</p>
                <p className={`text-xs mt-1 ${notification.isRead ? 'text-gray-400' : iconColor}`}>{formatTimestamp(notification.timestamp)}</p>
              </div>
              {!notification.isRead && (
                <button 
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Mark as read"
                  className={`ml-auto p-1 rounded-full hover:bg-opacity-50 ${iconBgColor.replace('100', '300')} transition-colors`}
                >
                  <MailOpen className={`${iconColor} w-5 h-5`} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NotificationsCard;
