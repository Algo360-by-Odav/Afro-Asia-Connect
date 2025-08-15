'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import ChatModal from './ChatModal';

export default function FloatingChatButton() {
  const { user } = useAuth();
  const { conversations, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv._count?.messages || 0), 0);

  // Animate button when new messages arrive
  useEffect(() => {
    if (totalUnread > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [totalUnread]);

  // Listen for custom openChat event
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // Don't show for non-authenticated users
  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`relative bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ${
          isAnimating ? 'animate-bounce scale-110' : 'hover:scale-105'
        } ${totalUnread > 0 ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}
      >
        <div className="text-2xl">
          {totalUnread > 0 ? '💬' : '😊'}
        </div>
        
        {/* Unread Badge */}
        {totalUnread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        
        {/* Connection status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-gray-400'
        }`} title={isConnected ? 'Connected ✅' : 'Disconnected ❌'} />
      </button>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
