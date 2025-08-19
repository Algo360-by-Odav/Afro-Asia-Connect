'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import NotificationsCard from '../components/dashboard/NotificationsCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import {
  UserCircle,
  LayoutGrid,
  FileText,
  BadgeDollarSign,
  ArrowUpCircle,
  Settings,
  TrendingUp,
  MessageSquare,
  MailIcon,
  Star,
  ShoppingCart,
  Phone,
  Heart,
  BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: authLoading, token } = useAuth();
  const router = useRouter();

  interface DashboardMetrics { 
    profileViews: number; 
    inquiriesReceived: number; 
    unreadMessages: number;
    subscription: {
      plan: string;
      renewsIn: number;
      status: string;
    };
  }
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  interface Notification { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; timestamp: Date; isRead?: boolean; }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  interface ActivityItem { id: string; type: 'message' | 'view' | 'alert' | 'performance' | 'update'; text: string; timestamp: Date; link?: string; }
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    
    if (user && token) {
      const fetchDashboardMetrics = async () => {
        try {
          setMetricsLoading(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/metrics`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
          const result = await response.json();
          setMetrics(result.data);
        } catch (err: any) { 
          setMetricsError(err.message); 
          console.error('Dashboard metrics error:', err);
        }
        finally { setMetricsLoading(false); }
      };
      fetchDashboardMetrics();
    } else {
      setMetricsLoading(false);
    }
  }, [user, token, authLoading, router]);

  useEffect(() => {
    if (!user || !token) {
      setNotificationsLoading(false);
      setActivitiesLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/notifications`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const result = await response.json();
        setNotifications(result.data.map((n: any) => ({ 
          id: n.id, 
          message: n.message || n.title, 
          type: n.type, 
          timestamp: new Date(n.createdAt), 
          isRead: n.isRead 
        })));
      } catch (err: any) { 
        setNotificationsError(err.message); 
        console.error('Notifications error:', err);
      }
      finally { setNotificationsLoading(false); }
    };
    fetchNotifications();

    const fetchRecentActivities = async () => {
      setActivitiesLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/dashboard/recent-activity`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) throw new Error('Failed to fetch recent activities');
        const result = await response.json();
        setRecentActivities(result.data.map((a: any) => ({
          id: a.id,
          type: a.type,
          text: a.text,
          timestamp: new Date(a.timestamp),
          link: a.link
        })));
      } catch (err: any) { 
        setActivitiesError(err.message); 
        console.error('Activities error:', err);
      }
      finally { setActivitiesLoading(false); }
    };
    fetchRecentActivities();
  }, [user, token]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-sky-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-red-600">Access Denied. Please log in.</p>
      </div>
    );
  }

  const baseSidebarItems = [
    { name: 'Profile Overview', href: '/dashboard/profile', icon: UserCircle },
    { name: 'Messages', href: '/messaging-test', icon: MessageSquare },
    { name: 'Manage Listings', href: '/dashboard/listings', icon: LayoutGrid },
    { name: 'View Leads', href: '/dashboard/leads', icon: FileText },
    { name: 'Subscription Status', href: '/dashboard/subscription', icon: BadgeDollarSign },
    { name: 'SMS Preferences', href: '/dashboard/sms-preferences', icon: Phone },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const providerSidebarItems = [
    { name: 'My Services', href: '/dashboard/services', icon: LayoutGrid },
    { name: 'Service Requests', href: '/dashboard/requests', icon: FileText },
    { name: 'Consultations', href: '/dashboard/consultations', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Compliance Docs', href: '/dashboard/compliance', icon: FileText },
    { name: 'Market Insights', href: '/dashboard/insights', icon: TrendingUp },
    { name: 'Billing', href: '/dashboard/billing', icon: BadgeDollarSign },
    { name: 'Team', href: '/dashboard/team', icon: UserCircle },
    { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  ];

  const sidebarItems = user?.user_type === 'service_provider'
    ? [
        { name: 'Profile Overview', href: '/dashboard/profile', icon: UserCircle },
        { name: 'Messages', href: '/messaging-test', icon: MessageSquare },
        ...providerSidebarItems,
        { name: 'SMS Preferences', href: '/dashboard/sms-preferences', icon: Phone },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    : baseSidebarItems;

  return (
    <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <aside className="hidden md:block md:w-64 bg-slate-800 text-slate-100 p-4 space-y-3 shadow-lg flex-shrink-0">
        <div className="text-center py-4 mb-2 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-sky-400">AfroAsiaConnect</h2>
        </div>
        <nav>
          <ul>
            {sidebarItems.map((item) => (
              <li key={item.name} className="mb-1">
                <Link
                  href={item.href}
                  className="flex items-center space-x-3 py-2.5 px-3 rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors duration-150 ease-in-out"
                >
                  <item.icon className="h-5 w-5 text-sky-400 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto bg-slate-50">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl flex items-center flex-wrap gap-3">
            Welcome, {(user?.firstName ?? user?.email) || 'User'}!
          {user?.user_type && (
              <span
                className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 capitalize"
                title={`You are logged in as a ${user.user_type}`}
              >
                {user.user_type}
              </span>
            )}
          </h1>
          <p className="mt-1 text-md text-slate-600">
            Here's your dashboard overview.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Profile Views Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-sky-200/50 transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-slate-700">Total Profile Views</h3>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-slate-800">
              {metricsLoading ? '...' : metricsError ? 'N/A' : (metrics?.profileViews || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Updated recently</p>
          </div>

          {/* Inquiries Received Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-sky-200/50 transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-slate-700">Inquiries Received</h3>
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-slate-800">
              {metricsLoading ? '...' : metricsError ? 'N/A' : (metrics?.inquiriesReceived || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics?.inquiriesReceived && metrics.inquiriesReceived > 0 ? 'Recent inquiries' : 'No inquiries yet'}
            </p>
          </div>

          {/* Unread Messages Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-sky-200/50 transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-slate-700">Unread Messages</h3>
              <MailIcon className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-4xl font-bold text-slate-800">
              {metricsLoading ? '...' : metricsError ? 'N/A' : (metrics?.unreadMessages || 0)}
            </p>
            <Link href="/dashboard/messages" className="text-xs text-sky-600 hover:underline mt-1 block">View Messages</Link>
          </div>

          {/* Subscription Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-sky-200/50 transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-slate-700">Subscription</h3>
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-lg font-semibold text-slate-800">
              {metricsLoading ? '...' : (metrics?.subscription?.plan || 'Basic Plan')}
            </p>
            <p className="text-sm text-slate-600">
              Renews in: <span className="font-bold">
                {metricsLoading ? '...' : `${metrics?.subscription?.renewsIn || 22} days`}
              </span>
            </p>
            <Link href="/pricing" className="text-xs text-sky-600 hover:underline mt-1 block">Manage Subscription</Link>
          </div>
        </div>

        {/* Updates & Notifications Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Updates & Notifications</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity for Sellers */}
            {user.user_type === 'seller' && (
              <RecentActivityCard
                activities={recentActivities}
                loading={activitiesLoading}
                error={activitiesError}
              />
            )}

            {/* Notifications for All */}
            <NotificationsCard
              notifications={notifications}
              loading={notificationsLoading}
              error={notificationsError}
              token={token}
            />

            {/* Buyer Specific Actions */}
            {user.user_type === 'buyer' && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/listings')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition duration-150"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Browse Products
                </button>
                <button
                  onClick={() => router.push('/dashboard/saved-items')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-150"
                >
                  <Heart size={20} className="mr-2" />
                  Saved Items
                </button>
              </div>
            )}

            {/* Fallback for other user types or if no specific actions */}
            {(user.user_type !== 'seller' && user.user_type !== 'buyer') && (
                 <p className="text-gray-600">No specific actions available for your user type yet.</p>
            )}
          </div>
        </div>
      </main> {/* Closing main tag */}
    </div>
  );
}
