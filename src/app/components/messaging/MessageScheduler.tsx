'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ScheduledMessage {
  id: number;
  content: string;
  scheduledFor: string;
  status: 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED';
  conversation: {
    participants: Array<{
      id: number;
      firstName: string;
      lastName: string;
    }>;
  };
  createdAt: string;
}

interface MessageSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: number;
  onScheduleMessage?: (content: string, scheduledFor: string) => void;
}

const MessageScheduler: React.FC<MessageSchedulerProps> = ({ 
  isOpen, 
  onClose, 
  conversationId, 
  onScheduleMessage 
}) => {
  const { user } = useAuth();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    content: '',
    scheduledFor: '',
    time: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      loadScheduledMessages();
    }
  }, [isOpen, user]);

  const loadScheduledMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/scheduled-messages?userId=${user.id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setScheduledMessages(data);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleMessage = async () => {
    if (!user || !newSchedule.content.trim() || !newSchedule.scheduledFor || !newSchedule.time) {
      return;
    }

    if (!conversationId) {
      alert('Please select a conversation first');
      return;
    }

    try {
      const scheduledDateTime = `${newSchedule.scheduledFor}T${newSchedule.time}:00`;
      
      const response = await fetch('http://localhost:3001/api/scheduled-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          senderId: user.id,
          conversationId,
          content: newSchedule.content,
          scheduledFor: scheduledDateTime
        })
      });
      
      if (response.ok) {
        setNewSchedule({ content: '', scheduledFor: '', time: '' });
        setShowCreateForm(false);
        loadScheduledMessages();
        
        if (onScheduleMessage) {
          onScheduleMessage(newSchedule.content, scheduledDateTime);
        }
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  };

  const cancelScheduledMessage = async (messageId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/scheduled-messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        loadScheduledMessages();
      }
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'SENT': return '✅';
      case 'CANCELLED': return '❌';
      case 'FAILED': return '🚫';
      default: return '❓';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // At least 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">⏰ Message Scheduler</h2>
          <div className="flex items-center space-x-2">
            {conversationId && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                ⏰ Schedule Message
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!conversationId && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                📝 Select a conversation to schedule messages
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500">Loading scheduled messages...</p>
            </div>
          ) : scheduledMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                ⏰ No scheduled messages found
              </p>
              {conversationId && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ⏰ Schedule Your First Message
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">📋 Your Scheduled Messages</h3>
              {scheduledMessages.map((message) => (
                <div
                  key={message.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {getStatusEmoji(message.status)} {message.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          To: {message.conversation.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-800 mb-2">{message.content}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 Scheduled: {formatDateTime(message.scheduledFor)}</span>
                        <span>📝 Created: {formatDateTime(message.createdAt)}</span>
                      </div>
                      
                      {message.status === 'PENDING' && (
                        <div className="mt-3">
                          <button
                            onClick={() => cancelScheduledMessage(message.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Message Modal */}
        {showCreateForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">⏰ Schedule Message</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    value={newSchedule.content}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={newSchedule.scheduledFor}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Schedule messages for optimal engagement times or when you know the recipient will be available.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={scheduleMessage}
                  disabled={!newSchedule.content.trim() || !newSchedule.scheduledFor || !newSchedule.time}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏰ Schedule Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageScheduler;
