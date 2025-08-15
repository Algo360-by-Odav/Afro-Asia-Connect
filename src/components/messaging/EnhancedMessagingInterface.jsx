import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Tabs, Tab, Badge } from 'react-bootstrap';
import { 
  FaRobot, 
  FaShieldAlt, 
  FaChartLine, 
  FaPaperPlane, 
  FaPlus,
  FaSearch,
  FaCog,
  FaBell
} from 'react-icons/fa';
import AIMessageSuggestions from './AIMessageSuggestions';
import SecurityPanel from './SecurityPanel';
import BusinessAutomationDashboard from './BusinessAutomationDashboard';
import api from '../../services/api';

const EnhancedMessagingInterface = ({ userId, conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(conversationId);
  const [loading, setLoading] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showAutomationDashboard, setShowAutomationDashboard] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/messaging/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messaging/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      let messageContent = newMessage;

      // Encrypt message if encryption is enabled
      if (encryptionEnabled) {
        const encryptResponse = await api.post('/advanced-messaging/encrypt', {
          messageContent: newMessage,
          conversationId: selectedConversation
        });
        
        if (encryptResponse.data.success) {
          messageContent = encryptResponse.data.encryptedContent;
        }
      }

      // Send message
      const response = await api.post('/messaging/send', {
        conversationId: selectedConversation,
        content: messageContent,
        isEncrypted: encryptionEnabled
      });

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        
        // Trigger lead scoring update
        await api.post('/advanced-messaging/calculate-lead-score', {
          conversationId: selectedConversation
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSuggestionSelect = (suggestionText) => {
    setNewMessage(suggestionText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationPreview = (conversation) => {
    const lastMessage = conversation.messages?.[0];
    return lastMessage ? lastMessage.content.substring(0, 50) + '...' : 'No messages yet';
  };

  return (
    <Container fluid className="enhanced-messaging-interface">
      <Row className="h-100">
        {/* Conversations Sidebar */}
        <Col md={3} className="conversations-sidebar border-end">
          <div className="sidebar-header p-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Conversations</h5>
              <Button variant="primary" size="sm">
                <FaPlus className="me-1" />
                New
              </Button>
            </div>
          </div>
          
          <div className="search-bar p-3">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control 
                placeholder="Search conversations..." 
                size="sm"
              />
            </InputGroup>
          </div>

          <div className="conversations-list">
            {conversations.map(conversation => (
              <div 
                key={conversation.id}
                className={`conversation-item p-3 border-bottom cursor-pointer ${
                  selectedConversation === conversation.id ? 'active' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="d-flex align-items-start">
                  <div className="conversation-avatar me-2">
                    <div className="avatar-circle">
                      {conversation.participants?.[0]?.name?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <div className="conversation-details flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="conversation-name fw-bold">
                        {conversation.participants?.[0]?.name || 'Unknown User'}
                      </span>
                      <small className="text-muted">
                        {formatMessageTime(conversation.updatedAt)}
                      </small>
                    </div>
                    <div className="conversation-preview text-muted">
                      {getConversationPreview(conversation)}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge bg="primary" className="mt-1">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Col>

        {/* Main Chat Area */}
        <Col md={6} className="chat-area d-flex flex-column">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header p-3 border-bottom bg-light">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="chat-avatar me-2">
                      <div className="avatar-circle">U</div>
                    </div>
                    <div>
                      <div className="chat-name fw-bold">Business Partner</div>
                      <div className="chat-status text-muted small">
                        {encryptionEnabled && (
                          <span className="me-2">
                            <FaShieldAlt className="text-success me-1" />
                            Encrypted
                          </span>
                        )}
                        Online
                      </div>
                    </div>
                  </div>
                  
                  <div className="chat-actions">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => setShowAISuggestions(!showAISuggestions)}
                    >
                      <FaRobot className="me-1" />
                      AI
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="me-2"
                      onClick={() => setShowSecurityPanel(!showSecurityPanel)}
                    >
                      <FaShieldAlt className="me-1" />
                      Security
                    </Button>
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => setShowAutomationDashboard(!showAutomationDashboard)}
                    >
                      <FaChartLine className="me-1" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-area flex-grow-1 p-3 overflow-auto">
                {loading ? (
                  <div className="text-center">Loading messages...</div>
                ) : (
                  <>
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`message mb-3 ${
                          message.senderId === userId ? 'message-sent' : 'message-received'
                        }`}
                      >
                        <div className="message-bubble">
                          <div className="message-content">
                            {message.content}
                          </div>
                          <div className="message-meta">
                            <small className="text-muted">
                              {formatMessageTime(message.createdAt)}
                              {message.isEncrypted && (
                                <FaShieldAlt className="ms-1 text-success" size={12} />
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="message-input p-3 border-top">
                <InputGroup>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    variant="primary" 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <FaPaperPlane />
                  </Button>
                </InputGroup>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected d-flex align-items-center justify-content-center h-100">
              <div className="text-center text-muted">
                <FaRobot size={48} className="mb-3 opacity-50" />
                <h5>Select a conversation to start messaging</h5>
                <p>Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </Col>

        {/* Right Sidebar - Advanced Features */}
        <Col md={3} className="features-sidebar border-start">
          <Tabs defaultActiveKey="ai" className="sidebar-tabs">
            {showAISuggestions && (
              <Tab eventKey="ai" title={
                <span>
                  <FaRobot className="me-1" />
                  AI Assistant
                </span>
              }>
                <div className="tab-content p-3">
                  <AIMessageSuggestions 
                    conversationId={selectedConversation}
                    onSuggestionSelect={handleSuggestionSelect}
                    context={{ businessContext: 'general' }}
                  />
                </div>
              </Tab>
            )}

            {showSecurityPanel && (
              <Tab eventKey="security" title={
                <span>
                  <FaShieldAlt className="me-1" />
                  Security
                </span>
              }>
                <div className="tab-content p-3">
                  <SecurityPanel 
                    conversationId={selectedConversation}
                    onSecurityUpdate={(settings) => {
                      if (settings.encryption !== undefined) {
                        setEncryptionEnabled(settings.encryption);
                      }
                    }}
                  />
                </div>
              </Tab>
            )}

            {showAutomationDashboard && (
              <Tab eventKey="automation" title={
                <span>
                  <FaChartLine className="me-1" />
                  Automation
                </span>
              }>
                <div className="tab-content p-3">
                  <BusinessAutomationDashboard userId={userId} />
                </div>
              </Tab>
            )}

            <Tab eventKey="settings" title={
              <span>
                <FaCog className="me-1" />
                Settings
              </span>
            }>
              <div className="tab-content p-3">
                <Card>
                  <Card.Header>
                    <Card.Title className="mb-0">Messaging Settings</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Check
                        type="switch"
                        label="Enable AI Suggestions"
                        checked={aiSuggestionsEnabled}
                        onChange={(e) => setAiSuggestionsEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Auto-encrypt Messages"
                        checked={encryptionEnabled}
                        onChange={(e) => setEncryptionEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Real-time Notifications"
                        defaultChecked
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Read Receipts"
                        defaultChecked
                        className="mb-3"
                      />
                    </Form>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      <style jsx>{`
        .enhanced-messaging-interface {
          height: 100vh;
          background: #f8f9fa;
        }

        .conversations-sidebar {
          background: white;
          height: 100vh;
          overflow-y: auto;
        }

        .conversation-item {
          transition: background-color 0.2s ease;
        }

        .conversation-item:hover {
          background-color: #f8f9fa;
        }

        .conversation-item.active {
          background-color: #e3f2fd;
          border-left: 4px solid #2196f3;
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .chat-area {
          background: white;
          height: 100vh;
        }

        .messages-area {
          background: #fafafa;
        }

        .message-sent {
          display: flex;
          justify-content: flex-end;
        }

        .message-received {
          display: flex;
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }

        .message-sent .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message-received .message-bubble {
          background: white;
          border: 1px solid #e0e0e0;
          color: #333;
        }

        .message-content {
          margin-bottom: 4px;
        }

        .message-meta {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .features-sidebar {
          background: white;
          height: 100vh;
          overflow-y: auto;
        }

        .sidebar-tabs .nav-link {
          font-size: 0.9rem;
          padding: 0.75rem 1rem;
        }

        .tab-content {
          max-height: calc(100vh - 60px);
          overflow-y: auto;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .no-conversation-selected {
          background: #fafafa;
        }

        @media (max-width: 768px) {
          .conversations-sidebar,
          .features-sidebar {
            display: none;
          }
          
          .chat-area {
            padding: 0;
          }
        }
      `}</style>
    </Container>
  );
};

export default EnhancedMessagingInterface;
