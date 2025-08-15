import React, { useContext } from 'react';
import { Container } from 'react-bootstrap';
import EnhancedMessagingInterface from '../components/messaging/EnhancedMessagingInterface';
import { AuthContext } from '../contexts/AuthContext';

const MessagingPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="messaging-page">
      <EnhancedMessagingInterface 
        userId={user?.id} 
        conversationId={null}
      />
    </div>
  );
};

// Disable static generation to prevent SSR issues with AuthContext
export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default MessagingPage;
