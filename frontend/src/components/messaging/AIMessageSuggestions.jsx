import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaRobot, FaLightbulb, FaLanguage, FaChartLine } from 'react-icons/fa';
import api from '../../services/api';

const AIMessageSuggestions = ({ conversationId, onSuggestionSelect, context = {} }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);

  useEffect(() => {
    if (conversationId) {
      loadSuggestions();
    }
  }, [conversationId, context]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/advanced-messaging/suggestions', {
        params: {
          conversationId,
          context: JSON.stringify(context)
        }
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to load AI suggestions');
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async (text) => {
    try {
      const response = await api.post('/advanced-messaging/analyze-sentiment', {
        messageText: text
      });

      if (response.data.success) {
        setSentimentAnalysis(response.data.sentiment);
      }
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion.text);
    analyzeSentiment(suggestion.text);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.label) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      case 'neutral': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'secondary';
  };

  if (loading) {
    return (
      <Card className="ai-suggestions-card">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading AI suggestions...</span>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="ai-suggestions-error">
        <FaRobot className="me-2" />
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-2"
          onClick={loadSuggestions}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="ai-suggestions-container">
      <Card className="ai-suggestions-card">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <FaRobot className="text-primary me-2" />
            <span className="fw-bold">AI Message Suggestions</span>
          </div>
          <Badge bg="info" className="d-flex align-items-center">
            <FaLightbulb className="me-1" size={12} />
            Smart
          </Badge>
        </Card.Header>

        <Card.Body>
          {suggestions.length === 0 ? (
            <div className="text-center text-muted py-3">
              <FaRobot size={24} className="mb-2 opacity-50" />
              <p className="mb-0">No suggestions available</p>
              <small>Start a conversation to get AI-powered suggestions</small>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="suggestion-item mb-2 p-3 border rounded hover-shadow cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="suggestion-text flex-grow-1">
                      {suggestion.text}
                    </div>
                    <div className="suggestion-meta ms-2">
                      <Badge 
                        bg={getConfidenceColor(suggestion.confidence)} 
                        className="me-1"
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                      <Badge variant="outline-secondary" size="sm">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </div>
                  
                  {suggestion.category && (
                    <div className="suggestion-category">
                      <small className="text-muted">
                        Category: <span className="fw-medium">{suggestion.category}</span>
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sentimentAnalysis && (
            <div className="sentiment-analysis mt-3 p-3 bg-light rounded">
              <div className="d-flex align-items-center mb-2">
                <FaChartLine className="text-info me-2" />
                <span className="fw-bold">Sentiment Analysis</span>
              </div>
              
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <Badge bg={getSentimentColor(sentimentAnalysis)} className="me-2">
                    {sentimentAnalysis.label?.toUpperCase()}
                  </Badge>
                  <small className="text-muted">
                    Score: {sentimentAnalysis.score?.toFixed(2)}
                  </small>
                </div>
                
                <div className="text-end">
                  <small className="text-muted d-block">
                    Business Tone: <span className="fw-medium">{sentimentAnalysis.businessTone}</span>
                  </small>
                  {sentimentAnalysis.emotions?.length > 0 && (
                    <small className="text-muted">
                      Emotions: {sentimentAnalysis.emotions.join(', ')}
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="text-center">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadSuggestions}
            disabled={loading}
          >
            <FaRobot className="me-1" />
            Refresh Suggestions
          </Button>
        </Card.Footer>
      </Card>

      <style jsx>{`
        .ai-suggestions-card {
          border: 1px solid #e3f2fd;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .suggestion-item {
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .suggestion-item:hover {
          background: #f0f8ff;
          border-color: #2196f3 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .hover-shadow:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .suggestion-text {
          font-size: 0.95rem;
          line-height: 1.4;
          color: #333;
        }

        .sentiment-analysis {
          border-left: 4px solid #2196f3;
        }

        .ai-suggestions-container {
          max-width: 400px;
        }

        @media (max-width: 768px) {
          .ai-suggestions-container {
            max-width: 100%;
          }
          
          .suggestion-item {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AIMessageSuggestions;
