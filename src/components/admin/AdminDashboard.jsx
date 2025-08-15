import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import { 
  FaUsers, 
  FaChartLine, 
  FaShieldAlt, 
  FaCog, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaSync as FaRefresh
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [moderationItems, setModerationItems] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedModerationItem, setSelectedModerationItem] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, usersRes, moderationRes, healthRes, analyticsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users?limit=10'),
        api.get('/admin/moderation?status=pending'),
        api.get('/admin/health'),
        api.get('/admin/analytics/advanced?timeframe=7d')
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.overview);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (moderationRes.data.success) setModerationItems(moderationRes.data.items);
      if (healthRes.data.success) setSystemHealth(healthRes.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.metrics);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error loading dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const response = await api.post(`/admin/users/${userId}/action`, {
        action,
        reason: actionReason
      });

      if (response.data.success) {
        showAlert(`User ${action} successfully`, 'success');
        setShowUserModal(false);
        setActionReason('');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      showAlert('Error performing user action', 'danger');
    }
  };

  const handleModerationAction = async (itemId, itemType, action) => {
    try {
      const response = await api.post(`/admin/moderation/${itemId}/action`, {
        itemType,
        action,
        reason: actionReason
      });

      if (response.data.success) {
        showAlert(`Content ${action} successfully`, 'success');
        setShowModerationModal(false);
        setActionReason('');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error performing moderation action:', error);
      showAlert('Error performing moderation action', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ message, variant });
    setTimeout(() => setAlert(null), 5000);
  };

  const exportReport = async (reportType) => {
    try {
      const response = await api.get(`/admin/reports/export?reportType=${reportType}&format=csv`);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showAlert('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showAlert('Error exporting report', 'danger');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger',
      pending: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <FaCheckCircle className="text-success" />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" />;
      case 'critical':
        return <FaTimesCircle className="text-danger" />;
      default:
        return <FaExclamationTriangle className="text-muted" />;
    }
  };

  if (loading && !overview) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading admin dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-dashboard">
      {alert && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <div className="dashboard-header mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="mb-0">Admin Dashboard</h2>
            <p className="text-muted">Platform management and monitoring</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-primary" onClick={loadDashboardData} disabled={loading}>
              <FaRefresh className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-primary">
                  <FaUsers className="text-white" />
                </div>
                <div className="ms-3">
                  <div className="stat-value">{overview?.totalUsers?.toLocaleString() || 0}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-success">
                  <FaChartLine className="text-white" />
                </div>
                <div className="ms-3">
                  <div className="stat-value">{overview?.activeConnections?.toLocaleString() || 0}</div>
                  <div className="stat-label">Active Connections</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-warning">
                  <FaExclamationTriangle className="text-white" />
                </div>
                <div className="ms-3">
                  <div className="stat-value">{moderationItems?.length || 0}</div>
                  <div className="stat-label">Pending Moderation</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-info">
                  <FaShieldAlt className="text-white" />
                </div>
                <div className="ms-3">
                  <div className="stat-value">
                    {systemHealth?.overallStatus === 'healthy' ? '100%' : '85%'}
                  </div>
                  <div className="stat-label">System Health</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="users" className="mb-4">
        {/* Users Management Tab */}
        <Tab eventKey="users" title={<span><FaUsers className="me-1" />Users</span>}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">User Management</h5>
              <Button variant="outline-primary" size="sm" onClick={() => exportReport('users')}>
                <FaDownload className="me-1" />
                Export
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="user-avatar me-2">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <small className="text-muted">ID: {user.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>
                        <Badge bg="secondary">{user.role || 'user'}</Badge>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Content Moderation Tab */}
        <Tab eventKey="moderation" title={<span><FaShieldAlt className="me-1" />Moderation</span>}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Content Moderation Queue</h5>
              <Badge bg="warning">{moderationItems.length} pending</Badge>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Content</th>
                    <th>Type</th>
                    <th>Author</th>
                    <th>Priority</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="content-preview">
                          {item.content?.substring(0, 100)}...
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">{item.contentType}</Badge>
                      </td>
                      <td>{item.authorName}</td>
                      <td>
                        <Badge bg={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'secondary'}>
                          {item.priority}
                        </Badge>
                      </td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          onClick={() => {
                            setSelectedModerationItem(item);
                            setShowModerationModal(true);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Analytics Tab */}
        <Tab eventKey="analytics" title={<span><FaChartLine className="me-1" />Analytics</span>}>
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">User Growth (Last 7 Days)</h6>
                </Card.Header>
                <Card.Body>
                  {analytics?.userGrowth && (
                    <Line
                      data={{
                        labels: analytics.userGrowth.labels,
                        datasets: [{
                          label: 'New Users',
                          data: analytics.userGrowth.data,
                          borderColor: '#667eea',
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          tension: 0.4
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">User Status Distribution</h6>
                </Card.Header>
                <Card.Body>
                  {overview && (
                    <Doughnut
                      data={{
                        labels: ['Active', 'Inactive', 'Suspended'],
                        datasets: [{
                          data: [
                            overview.activeUsers || 0,
                            overview.inactiveUsers || 0,
                            overview.suspendedUsers || 0
                          ],
                          backgroundColor: ['#28a745', '#6c757d', '#dc3545']
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* System Health Tab */}
        <Tab eventKey="health" title={<span><FaCog className="me-1" />System</span>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Health Status</h5>
            </Card.Header>
            <Card.Body>
              {systemHealth?.checks && (
                <Row>
                  {Object.entries(systemHealth.checks).map(([service, status]) => (
                    <Col md={4} key={service} className="mb-3">
                      <Card className={`border-${status.status === 'healthy' ? 'success' : status.status === 'warning' ? 'warning' : 'danger'}`}>
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            {getHealthStatusIcon(status.status)}
                            <div className="ms-2">
                              <div className="fw-bold text-capitalize">{service}</div>
                              <small className="text-muted">{status.message}</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* User Management Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manage User: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <div className="mb-3">
                <strong>Email:</strong> {selectedUser.email}<br />
                <strong>Status:</strong> {getStatusBadge(selectedUser.status)}<br />
                <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Action Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={() => handleUserAction(selectedUser?.id, 'suspend')}
            disabled={!actionReason.trim()}
          >
            Suspend
          </Button>
          <Button
            variant="success"
            onClick={() => handleUserAction(selectedUser?.id, 'activate')}
            disabled={!actionReason.trim()}
          >
            Activate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Moderation Modal */}
      <Modal show={showModerationModal} onHide={() => setShowModerationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Content Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedModerationItem && (
            <>
              <div className="mb-3">
                <strong>Content Type:</strong> <Badge bg="info">{selectedModerationItem.contentType}</Badge><br />
                <strong>Author:</strong> {selectedModerationItem.authorName}<br />
                <strong>Priority:</strong> <Badge bg="warning">{selectedModerationItem.priority}</Badge>
              </div>
              <div className="mb-3">
                <strong>Content:</strong>
                <div className="border p-3 mt-2 bg-light">
                  {selectedModerationItem.content}
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Action Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModerationModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleModerationAction(selectedModerationItem?.id, selectedModerationItem?.contentType, 'reject')}
            disabled={!actionReason.trim()}
          >
            Reject
          </Button>
          <Button
            variant="success"
            onClick={() => handleModerationAction(selectedModerationItem?.id, selectedModerationItem?.contentType, 'approve')}
            disabled={!actionReason.trim()}
          >
            Approve
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .admin-dashboard {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 2rem 0;
        }

        .stat-card {
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .user-avatar {
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

        .content-preview {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-header {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </Container>
  );
};

export default AdminDashboard;
