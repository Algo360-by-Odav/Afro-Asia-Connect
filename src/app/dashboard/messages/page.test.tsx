import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessagesPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe('MessagesPage', () => {
  it('renders the messages page with main sections', () => {
    render(<MessagesPage />);
    
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('displays message input with proper accessibility', () => {
    render(<MessagesPage />);
    
    const messageInput = screen.getByRole('textbox', { name: /type your message/i });
    expect(messageInput).toBeInTheDocument();
    expect(messageInput).toHaveAttribute('placeholder');
  });

  it('has send button with proper accessibility', () => {
    render(<MessagesPage />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('handles message input changes', () => {
    render(<MessagesPage />);
    
    const messageInput = screen.getByRole('textbox', { name: /type your message/i });
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    
    expect(messageInput).toHaveValue('Test message');
  });

  it('displays conversation list', () => {
    render(<MessagesPage />);
    
    // Check for conversation elements
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('shows message history area', () => {
    render(<MessagesPage />);
    
    // Check for message history container
    const messageArea = screen.getByRole('main') || screen.getByTestId('message-area');
    expect(messageArea).toBeInTheDocument();
  });
});
