import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ProgressBar, Modal, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import { 
  FaRobot, 
  FaChartLine, 
  FaUsers, 
  FaCalendarAlt,
  FaLightbulb,
  FaBullseye as FaTarget,
  FaCog,
  FaPlay,
  FaPause
} from 'react-icons/fa';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';

const BusinessAutomationDashboard = ({ userId }) => {
  const [insights, setInsights] = useState(null);
  const [leadScores, setLeadScores] = useState([]);
  const [businessMatches, setBusinessMatches] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load business insights
      const insightsResponse = await api.get('/advanced-messaging/business-insights', {
        params: { timeframe: '30d' }
      });
      
      if (insightsResponse.data.success) {
        setInsights(insightsResponse.data.insights);
      }

      // Load business matches
      const matchesResponse = await api.get('/advanced-messaging/business-matches');
      
      if (matchesResponse.data.success) {
        setBusinessMatches(matchesResponse.data.matches);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleFollowUp = async (conversationId, followUpType, delay) => {
    try {
      const response = await api.post('/advanced-messaging/schedule-followup', {
        conversationId,
        followUpType,
        delay
      });

      if (response.data.success) {
        setShowFollowUpModal(false);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    }
  };

  const calculateLeadScore = async (conversationId) => {
    try {
      const response = await api.post('/advanced-messaging/calculate-lead-score', {
        conversationId
      });

      if (response.data.success) {
        return response.data.leadScore;
      }
    } catch (error) {
      console.error('Error calculating lead score:', error);
    }
  };

  const getLeadQualityColor = (quality) => {
    switch (quality) {
      case 'hot': return 'danger';
      case 'warm': return 'warning';
      case 'qualified': return 'info';
      case 'cold': return 'secondary';
      default: return 'secondary';
    }
  };

  const getInsightChartData = () => {
    if (!insights) return null;

    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Messages Sent',
          data: [65, 78, 90, 81],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Messages Received',
          data: [45, 56, 67, 73],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const getLeadDistributionData = () => {
    if (!insights) return null;

    return {
      labels: ['Hot Leads', 'Warm Leads', 'Qualified Leads', 'Cold Leads'],
      datasets: [
        {
          data: [
            insights.leads?.hotLeads || 0,
            insights.leads?.warmLeads || 0,
            insights.leads?.totalLeads - (insights.leads?.hotLeads + insights.leads?.warmLeads) || 0,
            10 // Mock cold leads
          ],
          backgroundColor: [
            '#dc3545',
            '#ffc107',
            '#17a2b8',
            '#6c757d'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  return (
    <div className="business-automation-dashboard">
      <div className="dashboard-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <FaRobot className="text-primary me-3" size={24} />
            <div>
              <h4 className="mb-0">Business Automation Dashboard</h4>
              <small className="text-muted">AI-powered business insights and automation</small>
            </div>
          </div>
          <Button variant="primary" onClick={loadDashboardData} disabled={loading}>
            <FaCog className="me-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultActiveKey="insights" className="mb-4">
        <Tab eventKey="insights" title={
          <span><FaChartLine className="me-1" />Insights</span>
        }>
          {insights && (
            <div className="insights-tab">
              {/* Key Metrics */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <Card className="metric-card h-100">
                    <Card.Body className="text-center">
                      <FaChartLine size={24} className="text-primary mb-2" />
                      <div className="metric-value">{insights.messaging?.messagesSent || 0}</div>
                      <div className="metric-label">Messages Sent</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3 mb-3">
                  <Card className="metric-card h-100">
                    <Card.Body className="text-center">
                      <FaUsers size={24} className="text-success mb-2" />
                      <div className="metric-value">{insights.messaging?.activeConversations || 0}</div>
                      <div className="metric-label">Active Conversations</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3 mb-3">
                  <Card className="metric-card h-100">
                    <Card.Body className="text-center">
                      <FaTarget size={24} className="text-warning mb-2" />
                      <div className="metric-value">{insights.leads?.hotLeads || 0}</div>
                      <div className="metric-label">Hot Leads</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3 mb-3">
                  <Card className="metric-card h-100">
                    <Card.Body className="text-center">
                      <FaCalendarAlt size={24} className="text-info mb-2" />
                      <div className="metric-value">{insights.opportunities?.followUpsScheduled || 0}</div>
                      <div className="metric-label">Follow-ups Scheduled</div>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              {/* Charts */}
              <div className="row mb-4">
                <div className="col-md-8 mb-3">
                  <Card>
                    <Card.Header>
                      <Card.Title className="mb-0">Messaging Activity</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {getInsightChartData() && (
                        <Line 
                          data={getInsightChartData()} 
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                            },
                          }}
                        />
                      )}
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-4 mb-3">
                  <Card>
                    <Card.Header>
                      <Card.Title className="mb-0">Lead Distribution</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {getLeadDistributionData() && (
                        <Doughnut 
                          data={getLeadDistributionData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                          height={200}
                        />
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </div>

              {/* Recommendations */}
              <Card className="recommendations-card">
                <Card.Header>
                  <div className="d-flex align-items-center">
                    <FaLightbulb className="text-warning me-2" />
                    <span className="fw-bold">AI Recommendations</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  {insights.recommendations?.length > 0 ? (
                    <div className="recommendations-list">
                      {insights.recommendations.map((rec, index) => (
                        <Alert key={index} variant={rec.priority === 'high' ? 'warning' : 'info'} className="mb-2">
                          <div className="d-flex align-items-start">
                            <FaLightbulb className="me-2 mt-1" />
                            <div>
                              <div className="fw-bold">{rec.title}</div>
                              <div>{rec.description}</div>
                              <Badge bg={rec.priority === 'high' ? 'warning' : 'info'} className="mt-1">
                                {rec.priority} priority
                              </Badge>
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <FaLightbulb size={24} className="mb-2 opacity-50" />
                      <p className="mb-0">No recommendations available</p>
                      <small>Keep engaging with customers to get AI-powered insights</small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Tab>

        <Tab eventKey="matches" title={
          <span><FaUsers className="me-1" />Business Matches</span>
        }>
          <div className="matches-tab">
            <Card>
              <Card.Header>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold">Smart Business Matches</span>
                  <Badge bg="info">{businessMatches.length} matches found</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {businessMatches.length > 0 ? (
                  <div className="matches-list">
                    {businessMatches.map((match, index) => (
                      <Card key={index} className="match-card mb-3">
                        <Card.Body>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="match-info">
                              <div className="fw-bold">{match.user.name}</div>
                              <div className="text-muted">{match.user.businessProfile?.industry}</div>
                              <div className="match-reasons mt-1">
                                {match.matchReasons.map((reason, idx) => (
                                  <Badge key={idx} bg="light" text="dark" className="me-1">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="match-score text-center">
                              <div className="score-circle">
                                <div className="score-value">{match.matchScore}</div>
                                <div className="score-label">Match</div>
                              </div>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => {/* Handle connect */}}
                              >
                                Connect
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <FaUsers size={32} className="mb-3 opacity-50" />
                    <p className="mb-0">No business matches found</p>
                    <small>Complete your business profile to get better matches</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Tab>

        <Tab eventKey="automation" title={
          <span><FaRobot className="me-1" />Automation</span>
        }>
          <div className="automation-tab">
            <div className="row">
              <div className="col-md-6 mb-3">
                <Card className="automation-card">
                  <Card.Header>
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="text-primary me-2" />
                      <span className="fw-bold">Follow-up Automation</span>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted">Automatically schedule follow-ups based on conversation context</p>
                    <Button 
                      variant="primary"
                      onClick={() => setShowFollowUpModal(true)}
                    >
                      <FaPlay className="me-1" />
                      Schedule Follow-up
                    </Button>
                  </Card.Body>
                </Card>
              </div>

              <div className="col-md-6 mb-3">
                <Card className="automation-card">
                  <Card.Header>
                    <div className="d-flex align-items-center">
                      <FaTarget className="text-success me-2" />
                      <span className="fw-bold">Lead Scoring</span>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted">AI-powered lead qualification and scoring</p>
                    <Button 
                      variant="success"
                      onClick={() => {/* Handle lead scoring */}}
                    >
                      <FaChartLine className="me-1" />
                      Analyze Leads
                    </Button>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* Follow-up Modal */}
      <Modal show={showFollowUpModal} onHide={() => setShowFollowUpModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Schedule Follow-up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Follow-up Type</Form.Label>
              <Form.Select>
                <option value="inquiry_response">Inquiry Response</option>
                <option value="quote_follow_up">Quote Follow-up</option>
                <option value="meeting_reminder">Meeting Reminder</option>
                <option value="proposal_follow_up">Proposal Follow-up</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Delay (hours)</Form.Label>
              <Form.Control type="number" defaultValue="24" min="1" max="168" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFollowUpModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Schedule Follow-up
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .metric-card {
          border: 1px solid #e3f2fd;
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .recommendations-card {
          border: 1px solid #fff3cd;
          background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
        }

        .match-card {
          border: 1px solid #e8f5e8;
          transition: all 0.2s ease;
        }

        .match-card:hover {
          border-color: #28a745;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.15);
        }

        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .score-label {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .automation-card {
          border: 1px solid #e8f5e8;
          height: 100%;
        }

        @media (max-width: 768px) {
          .dashboard-header h4 {
            font-size: 1.25rem;
          }
          
          .metric-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessAutomationDashboard;
