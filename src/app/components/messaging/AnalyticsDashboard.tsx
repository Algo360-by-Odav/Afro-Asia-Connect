'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AnalyticsSummary {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  templatesUsed: number;
  scheduledMessages: number;
  filesShared: number;
  averageResponseTime: number | null;
  activeConversations: number;
  engagementScore: number;
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    if (isOpen && user) {
      loadAnalytics();
    }
  }, [isOpen, user, selectedPeriod]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/user/${user.id}?days=${selectedPeriod}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.summary);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponseTime = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">📊 Messaging Analytics</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              aria-label="Select time period for analytics"
              title="Select time period for analytics"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="text-center py-8">
              <p className="text-gray-500">📊 No analytics data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Messages</p>
                      <p className="text-2xl font-bold text-blue-800">{analytics.totalMessages}</p>
                    </div>
                    <div className="text-2xl">💬</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Messages Sent</p>
                      <p className="text-2xl font-bold text-green-800">{analytics.messagesSent}</p>
                    </div>
                    <div className="text-2xl">📤</div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Messages Received</p>
                      <p className="text-2xl font-bold text-purple-800">{analytics.messagesReceived}</p>
                    </div>
                    <div className="text-2xl">📥</div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Active Conversations</p>
                      <p className="text-2xl font-bold text-orange-800">{analytics.activeConversations}</p>
                    </div>
                    <div className="text-2xl">👥</div>
                  </div>
                </div>
              </div>

              {/* Response Time & Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">⏱️ Response Time</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 mb-2">
                      {formatResponseTime(analytics.averageResponseTime)}
                    </div>
                    <p className="text-sm text-gray-600">Average response time</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 Engagement Score</h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getEngagementColor(analytics.engagementScore)}`}>
                      {analytics.engagementScore}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {getEngagementLabel(analytics.engagementScore)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Usage */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Feature Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-xl font-bold text-gray-800">{analytics.templatesUsed}</div>
                    <p className="text-sm text-gray-600">Templates Used</p>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">⏰</div>
                    <div className="text-xl font-bold text-gray-800">{analytics.scheduledMessages}</div>
                    <p className="text-sm text-gray-600">Scheduled Messages</p>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">📎</div>
                    <div className="text-xl font-bold text-gray-800">{analytics.filesShared}</div>
                    <p className="text-sm text-gray-600">Files Shared</p>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Insights & Tips</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  {analytics.averageResponseTime && analytics.averageResponseTime > 120 && (
                    <p>• Consider using scheduled messages to respond during optimal times</p>
                  )}
                  {analytics.templatesUsed < analytics.messagesSent * 0.1 && (
                    <p>• Try using more message templates to improve professionalism and save time</p>
                  )}
                  {analytics.engagementScore < 50 && (
                    <p>• Increase engagement by using more features like file sharing and scheduling</p>
                  )}
                  {analytics.engagementScore >= 80 && (
                    <p>• Excellent engagement! You're making great use of all messaging features</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
