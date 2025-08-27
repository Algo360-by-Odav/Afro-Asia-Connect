'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MessageButton from '@/app/components/messaging/MessageButton';
import { API_BASE_URL } from '@/config/api';

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

export default function MessagingTestPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users for testing
    const fetchUsers = async () => {
      try {
        console.log('Fetching users from:', `${API_BASE_URL}/users`);
        const response = await fetch(`${API_BASE_URL}/users`, {
          credentials: 'include',
        });
        console.log('Users API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Users API data:', data);
          console.log('Current user ID:', user?.id);
          const filteredUsers = data.filter((u: User) => u.id !== user?.id);
          console.log('Filtered users:', filteredUsers);
          setUsers(filteredUsers);
        } else {
          console.error('Users API failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-6">
        <p>Please login to test messaging.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary-blue)] rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Enterprise Messaging Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience real-time communication with enterprise-grade encryption, AI-powered features, and seamless collaboration tools.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
            <p className="text-gray-600 text-sm">AES-256-GCM enterprise security</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Features</h3>
            <p className="text-gray-600 text-sm">Smart suggestions & sentiment analysis</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Sync</h3>
            <p className="text-gray-600 text-sm">Instant message delivery & typing indicators</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[var(--primary-blue)] px-8 py-6">
            <h2 className="text-2xl font-bold text-white mb-2">Available Users</h2>
            <p className="text-blue-100">Connect with team members and start conversations</p>
          </div>
          
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)]"></div>
                <span className="ml-4 text-gray-600">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Available</h3>
                <p className="text-gray-500">Create additional accounts to test the messaging system.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {users.map((targetUser) => (
                  <div key={targetUser.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-[var(--primary-blue)] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {targetUser.firstName ? targetUser.firstName.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim() : 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">{targetUser.email}</p>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[var(--primary-blue)]">
                              {targetUser.role === 'BUYER' ? '🛒 Buyer' : 
                               targetUser.role === 'SUPPLIER' ? '🏪 Seller' :
                               targetUser.role === 'SERVICE_PROVIDER' ? '🔧 Service Provider' : 
                               targetUser.role === 'ADMIN' ? '🏢 Admin' : '❓ Unknown'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ● Online
                            </span>
                          </div>
                        </div>
                      </div>
                      <MessageButton
                        targetUserId={targetUser.id}
                        targetUserName={targetUser.firstName}
                        className="bg-[var(--primary-blue)] hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Start Conversation
                      </MessageButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-10 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-6">
            <h3 className="text-2xl font-bold text-white mb-2">Testing Instructions</h3>
            <p className="text-green-100">Follow these steps to test the enterprise messaging system</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--primary-blue)] font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Start a Conversation</h4>
                  <p className="text-gray-600 text-sm">Click "Start Conversation" next to any user to initiate a chat</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Access Chat Modal</h4>
                  <p className="text-gray-600 text-sm">Click the floating chat button (bottom-right) to open conversations</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Real-Time Messaging</h4>
                  <p className="text-gray-600 text-sm">Send messages and see them appear instantly with encryption</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI Features</h4>
                  <p className="text-gray-600 text-sm">Experience smart suggestions and sentiment analysis</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-sm">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Multi-User Testing</h4>
                  <p className="text-gray-600 text-sm">Open incognito window, login as another user, and reply</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Advanced Features</h4>
                  <p className="text-gray-600 text-sm">Test file sharing, typing indicators, and message templates</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-10 bg-[var(--primary-blue)] rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise-Grade Features</h3>
            <p className="text-blue-200">Powered by cutting-edge technology for professional communication</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <p className="font-semibold">End-to-End Encryption</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🤖</div>
              <p className="font-semibold">AI Integration</p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-semibold">Real-Time Sync</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📁</div>
              <p className="font-semibold">File Sharing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
