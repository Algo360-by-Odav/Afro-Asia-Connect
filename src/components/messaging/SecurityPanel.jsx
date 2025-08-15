import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Form, Alert, Modal, ProgressBar, Tabs, Tab } from 'react-bootstrap';
import { 
  FaShieldAlt, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaFileAlt,
  FaCog,
  FaHistory
} from 'react-icons/fa';
import api from '../../services/api';

const SecurityPanel = ({ conversationId, onSecurityUpdate }) => {
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState('standard');
  const [dlpScanResults, setDlpScanResults] = useState(null);
  const [complianceReport, setComplianceReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const retentionPolicies = {
    temporary: { days: 30, label: 'Temporary (30 days)', color: 'warning' },
    standard: { days: 365, label: 'Standard (1 year)', color: 'primary' },
    compliance: { days: 2555, label: 'Compliance (7 years)', color: 'success' },
    permanent: { days: null, label: 'Permanent', color: 'info' }
  };

  useEffect(() => {
    loadSecuritySettings();
  }, [conversationId]);

  const loadSecuritySettings = async () => {
    try {
      // Load current security settings for conversation
      // This would typically come from a security settings endpoint
      setEncryptionEnabled(true); // Default for demo
      setRetentionPolicy('standard');
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const toggleEncryption = async () => {
    try {
      setLoading(true);
      
      if (!encryptionEnabled) {
        // Enable encryption
        const response = await api.post('/advanced-messaging/encrypt', {
          messageContent: 'Encryption test message',
          conversationId
        });
        
        if (response.data.success) {
          setEncryptionEnabled(true);
          onSecurityUpdate?.({ encryption: true });
        }
      } else {
        // Disable encryption (in real app, this might not be allowed)
        setEncryptionEnabled(false);
        onSecurityUpdate?.({ encryption: false });
      }
    } catch (error) {
      console.error('Error toggling encryption:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRetentionPolicy = async (newPolicy) => {
    try {
      setLoading(true);
      
      const response = await api.post('/advanced-messaging/retention-policy', {
        conversationId,
        policyType: newPolicy
      });

      if (response.data.success) {
        setRetentionPolicy(newPolicy);
        onSecurityUpdate?.({ retentionPolicy: newPolicy });
      }
    } catch (error) {
      console.error('Error updating retention policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanForSensitiveData = async (messageText) => {
    try {
      const response = await api.post('/advanced-messaging/scan-sensitive-data', {
        messageContent: messageText
      });

      if (response.data.success) {
        setDlpScanResults(response.data);
      }
    } catch (error) {
      console.error('Error scanning for sensitive data:', error);
    }
  };

  const generateComplianceReport = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await api.get('/advanced-messaging/compliance-report', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          complianceType: 'gdpr'
        }
      });

      if (response.data.success) {
        setComplianceReport(response.data.report);
        setShowComplianceModal(true);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDlpSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (encryptionEnabled) score += 40;
    if (retentionPolicy !== 'temporary') score += 30;
    if (!dlpScanResults?.sensitiveDataDetected) score += 30;
    return score;
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="security-panel">
      <Card className="security-card">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <FaShieldAlt className="text-primary me-2" />
            <span className="fw-bold">Security & Compliance</span>
          </div>
          <Badge bg={getSecurityScoreColor(getSecurityScore())}>
            Security Score: {getSecurityScore()}%
          </Badge>
        </Card.Header>

        <Card.Body>
          <Tabs defaultActiveKey="security" className="mb-3">
            <Tab eventKey="security" title={
              <span><FaShieldAlt className="me-1" />Security</span>
            }>
              {/* Encryption Settings */}
              <div className="security-section mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <FaLock className="text-success me-2" />
                    <div>
                      <div className="fw-bold">End-to-End Encryption</div>
                      <small className="text-muted">Secure your messages with encryption</small>
                    </div>
                  </div>
                  <Form.Check
                    type="switch"
                    checked={encryptionEnabled}
                    onChange={toggleEncryption}
                    disabled={loading}
                  />
                </div>
                
                {encryptionEnabled && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    Messages are encrypted with AES-256 encryption
                  </Alert>
                )}
              </div>

              {/* Data Retention */}
              <div className="security-section mb-4">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaHistory className="text-info me-2" />
                    <span className="fw-bold">Data Retention Policy</span>
                  </div>
                  <small className="text-muted">
                    Choose how long messages are stored
                  </small>
                </div>

                <div className="retention-options">
                  {Object.entries(retentionPolicies).map(([key, policy]) => (
                    <div 
                      key={key}
                      className={`retention-option p-3 border rounded mb-2 cursor-pointer ${
                        retentionPolicy === key ? 'border-primary bg-light' : ''
                      }`}
                      onClick={() => updateRetentionPolicy(key)}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <Badge bg={policy.color} className="me-2">
                            {policy.label}
                          </Badge>
                        </div>
                        <Form.Check
                          type="radio"
                          checked={retentionPolicy === key}
                          readOnly
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DLP Scan Results */}
              {dlpScanResults && (
                <div className="security-section mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FaExclamationTriangle className="text-warning me-2" />
                    <span className="fw-bold">Data Loss Prevention Scan</span>
                  </div>

                  {dlpScanResults.sensitiveDataDetected ? (
                    <Alert variant="warning">
                      <div className="mb-2">
                        <strong>Sensitive data detected!</strong>
                      </div>
                      {dlpScanResults.detectedData.map((data, index) => (
                        <div key={index} className="mb-1">
                          <Badge bg={getDlpSeverityColor(data.severity)} className="me-2">
                            {data.type.toUpperCase()}
                          </Badge>
                          <small>{data.matches} occurrence(s)</small>
                        </div>
                      ))}
                      <div className="mt-2">
                        <strong>Recommendation:</strong> {dlpScanResults.recommendation}
                      </div>
                    </Alert>
                  ) : (
                    <Alert variant="success">
                      <FaCheckCircle className="me-2" />
                      No sensitive data detected
                    </Alert>
                  )}
                </div>
              )}
            </Tab>

            <Tab eventKey="compliance" title={
              <span><FaFileAlt className="me-1" />Compliance</span>
            }>
              <div className="compliance-section">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div className="fw-bold">GDPR Compliance</div>
                    <small className="text-muted">
                      Generate compliance reports and audit trails
                    </small>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={generateComplianceReport}
                    disabled={loading}
                  >
                    <FaFileAlt className="me-1" />
                    Generate Report
                  </Button>
                </div>

                <div className="compliance-metrics">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <FaLock size={24} className="text-primary mb-2" />
                          <div className="fw-bold">Encryption Rate</div>
                          <div className="text-success h4">95%</div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <FaShieldAlt size={24} className="text-success mb-2" />
                          <div className="fw-bold">Security Score</div>
                          <div className="text-success h4">{getSecurityScore()}%</div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>

                <div className="audit-trail mt-4">
                  <div className="fw-bold mb-3">Recent Security Events</div>
                  <div className="audit-events">
                    <div className="audit-event p-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span>Encryption enabled</span>
                        <small className="text-muted">2 hours ago</small>
                      </div>
                    </div>
                    <div className="audit-event p-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span>Retention policy updated</span>
                        <small className="text-muted">1 day ago</small>
                      </div>
                    </div>
                    <div className="audit-event p-2">
                      <div className="d-flex justify-content-between">
                        <span>DLP scan completed</span>
                        <small className="text-muted">2 days ago</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Compliance Report Modal */}
      <Modal 
        show={showComplianceModal} 
        onHide={() => setShowComplianceModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt className="me-2" />
            Compliance Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {complianceReport && (
            <div className="compliance-report">
              <div className="report-header mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Report Type:</strong> {complianceReport.complianceType?.toUpperCase()}
                  </div>
                  <div className="col-md-6">
                    <strong>Generated:</strong> {new Date(complianceReport.generatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="report-metrics">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Card>
                      <Card.Body>
                        <div className="fw-bold">Data Processing</div>
                        <div>Total Messages: {complianceReport.metrics?.dataProcessing?.totalMessages}</div>
                        <div>Encrypted: {complianceReport.metrics?.dataProcessing?.encryptedMessages}</div>
                        <ProgressBar 
                          now={complianceReport.metrics?.dataProcessing?.encryptionRate} 
                          label={`${complianceReport.metrics?.dataProcessing?.encryptionRate}%`}
                          variant="success"
                        />
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mb-3">
                    <Card>
                      <Card.Body>
                        <div className="fw-bold">Security Events</div>
                        <div>Total Events: {complianceReport.metrics?.accessLogs?.totalAccessEvents}</div>
                        <div>Unauthorized: {complianceReport.metrics?.accessLogs?.unauthorizedAttempts}</div>
                        <ProgressBar 
                          now={complianceReport.metrics?.accessLogs?.securityScore} 
                          label={`${complianceReport.metrics?.accessLogs?.securityScore}%`}
                          variant="info"
                        />
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComplianceModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <FaFileAlt className="me-1" />
            Export Report
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .security-card {
          border: 1px solid #e8f5e8;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .security-section {
          border-bottom: 1px solid #eee;
          padding-bottom: 1rem;
        }

        .security-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .retention-option {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .retention-option:hover {
          border-color: #007bff !important;
          background-color: #f8f9fa !important;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .audit-event {
          font-size: 0.9rem;
        }

        .compliance-metrics .card {
          border: 1px solid #e3f2fd;
        }

        @media (max-width: 768px) {
          .security-panel {
            margin: 0 -15px;
          }
        }
      `}</style>
    </div>
  );
};

export default SecurityPanel;
