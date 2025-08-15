'use client';

import React, { useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

interface MessageButtonProps {
  targetUserId: number;
  targetUserName?: string;
  serviceRequestId?: number;
  consultationId?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function MessageButton({ 
  targetUserId, 
  targetUserName, 
  serviceRequestId, 
  consultationId,
  className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
  children = "Send Message"
}: MessageButtonProps) {
  const { user } = useAuth();
  const { createConversation, setActiveConversation } = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      const conversation = await createConversation(
        Number(user.id), 
        Number(targetUserId), 
        serviceRequestId, 
        consultationId
      );
      
      setActiveConversation(conversation);
      
      // You can emit a custom event to open the chat modal
      window.dispatchEvent(new CustomEvent('openChat'));
      
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || Number(user.id) === Number(targetUserId)) {
    return null; // Don't show message button for self
  }

  return (
    <button
      onClick={handleStartConversation}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Starting...' : children}
    </button>
  );
}
