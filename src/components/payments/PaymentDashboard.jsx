import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { 
  FaCreditCard, 
  FaReceipt, 
  FaChartLine, 
  FaDownload,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaSync
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ onSuccess, onError, amount, currency = 'USD', description }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const { data } = await api.post('/payments/create-payment-intent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description
      });

      if (!data.success) {
        throw new Error(data.error);
      }

      // Confirm payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-3">
        <Form.Label>Card Information</Form.Label>
        <div className="card-element-container">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
      </div>
      
      <div className="payment-summary mb-3">
        <div className="d-flex justify-content-between">
          <span>Amount:</span>
          <strong>{currency} {amount.toFixed(2)}</strong>
        </div>
        <div className="d-flex justify-content-between">
          <span>Description:</span>
          <span>{description}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        disabled={!stripe || processing || !cardComplete}
        className="w-100"
      >
        {processing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Processing...
          </>
        ) : (
          `Pay ${currency} ${amount.toFixed(2)}`
        )}
      </Button>
    </Form>
  );
};

const PaymentDashboard = ({ userId }) => {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [alert, setAlert] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(100);
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      const [paymentsRes, subscriptionsRes, invoicesRes, analyticsRes] = await Promise.all([
        api.get('/payments/history'),
        api.get('/payments/subscriptions'),
        api.get('/payments/invoices'),
        api.get('/admin/payments/analytics?timeframe=30d')
      ]);

      if (paymentsRes.data.success) setPayments(paymentsRes.data.payments);
      if (subscriptionsRes.data.success) setSubscriptions(subscriptionsRes.data.subscriptions);
      if (invoicesRes.data.success) setInvoices(invoicesRes.data.invoices);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
      showAlert('Error loading payment data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    showAlert('Payment processed successfully!', 'success');
    setShowPaymentModal(false);
    loadPaymentData();
  };

  const handlePaymentError = (error) => {
    showAlert(`Payment failed: ${error}`, 'danger');
  };

  const createSubscription = async (planId) => {
    try {
      const response = await api.post('/payments/create-subscription', {
        planId,
        userId
      });

      if (response.data.success) {
        showAlert('Subscription created successfully!', 'success');
        setShowSubscriptionModal(false);
        loadPaymentData();
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      showAlert('Error creating subscription', 'danger');
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await api.post(`/payments/cancel-subscription/${subscriptionId}`);

      if (response.data.success) {
        showAlert('Subscription cancelled successfully', 'success');
        loadPaymentData();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showAlert('Error cancelling subscription', 'danger');
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/payments/invoice/${invoiceId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showAlert('Error downloading invoice', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ message, variant });
    setTimeout(() => setAlert(null), 5000);
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      succeeded: 'success',
      pending: 'warning',
      failed: 'danger',
      cancelled: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getSubscriptionStatusBadge = (status) => {
    const variants = {
      active: 'success',
      past_due: 'warning',
      cancelled: 'danger',
      unpaid: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading payment dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Container fluid className="payment-dashboard">
        {alert && (
          <Alert variant={alert.variant} dismissible onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <div className="dashboard-header mb-4">
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0">Payment Dashboard</h2>
              <p className="text-muted">Manage payments, subscriptions, and billing</p>
            </Col>
            <Col xs="auto">
              <Button 
                variant="primary" 
                className="me-2"
                onClick={() => setShowPaymentModal(true)}
              >
                <FaPlus className="me-1" />
                New Payment
              </Button>
              <Button variant="outline-primary" onClick={loadPaymentData}>
                <FaSync className="me-1" />
                Refresh
              </Button>
            </Col>
          </Row>
        </div>

        {/* Analytics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-success">
                    <FaCreditCard className="text-white" />
                  </div>
                  <div className="ms-3">
                    <div className="stat-value">
                      ${analytics?.totalRevenue?.toLocaleString() || '0'}
                    </div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-primary">
                    <FaReceipt className="text-white" />
                  </div>
                  <div className="ms-3">
                    <div className="stat-value">{payments?.length || 0}</div>
                    <div className="stat-label">Total Payments</div>
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
                    <FaSync className="text-white" />
                  </div>
                  <div className="ms-3">
                    <div className="stat-value">{subscriptions?.length || 0}</div>
                    <div className="stat-label">Active Subscriptions</div>
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
                    <FaChartLine className="text-white" />
                  </div>
                  <div className="ms-3">
                    <div className="stat-value">
                      {analytics?.successRate ? `${analytics.successRate}%` : '0%'}
                    </div>
                    <div className="stat-label">Success Rate</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="payments" className="mb-4">
          {/* Payments Tab */}
          <Tab eventKey="payments" title={<span><FaCreditCard className="me-1" />Payments</span>}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Payment History</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>
                          <code>{payment.id.substring(0, 8)}...</code>
                        </td>
                        <td>
                          <strong>{payment.currency.toUpperCase()} {(payment.amount / 100).toFixed(2)}</strong>
                        </td>
                        <td>{getPaymentStatusBadge(payment.status)}</td>
                        <td>
                          <Badge bg="secondary">
                            {payment.paymentMethod?.type || 'card'}
                          </Badge>
                        </td>
                        <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <FaEye />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          {/* Subscriptions Tab */}
          <Tab eventKey="subscriptions" title={<span><FaSync className="me-1" />Subscriptions</span>}>
            <Row>
              <Col md={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Your Subscriptions</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Next Billing</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map(subscription => (
                          <tr key={subscription.id}>
                            <td>
                              <div>
                                <div className="fw-bold">{subscription.planName}</div>
                                <small className="text-muted">{subscription.description}</small>
                              </div>
                            </td>
                            <td>{getSubscriptionStatusBadge(subscription.status)}</td>
                            <td>
                              <strong>
                                {subscription.currency.toUpperCase()} {(subscription.amount / 100).toFixed(2)}
                                <small className="text-muted">/{subscription.interval}</small>
                              </strong>
                            </td>
                            <td>
                              {subscription.nextBilling ? 
                                new Date(subscription.nextBilling).toLocaleDateString() : 
                                'N/A'
                              }
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => cancelSubscription(subscription.id)}
                                disabled={subscription.status === 'cancelled'}
                              >
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Available Plans</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="subscription-plans">
                      <div className="plan-item mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">Basic Plan</div>
                            <small className="text-muted">Essential features</small>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold">$29/mo</div>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => createSubscription('basic')}
                            >
                              Subscribe
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="plan-item mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">Pro Plan</div>
                            <small className="text-muted">Advanced features</small>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold">$79/mo</div>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => createSubscription('pro')}
                            >
                              Subscribe
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="plan-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">Enterprise</div>
                            <small className="text-muted">Full platform access</small>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold">$199/mo</div>
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => createSubscription('enterprise')}
                            >
                              Subscribe
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* Invoices Tab */}
          <Tab eventKey="invoices" title={<span><FaReceipt className="me-1" />Invoices</span>}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Invoice History</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id}>
                        <td>
                          <code>#{invoice.number}</code>
                        </td>
                        <td>
                          <strong>{invoice.currency.toUpperCase()} {(invoice.amount / 100).toFixed(2)}</strong>
                        </td>
                        <td>{getPaymentStatusBadge(invoice.status)}</td>
                        <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                        <td>
                          {invoice.dueDate ? 
                            new Date(invoice.dueDate).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                          >
                            <FaDownload />
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
                    <h6 className="mb-0">Revenue Trend (Last 30 Days)</h6>
                  </Card.Header>
                  <Card.Body>
                    {analytics?.revenueTrend && (
                      <Line
                        data={{
                          labels: analytics.revenueTrend.labels,
                          datasets: [{
                            label: 'Revenue',
                            data: analytics.revenueTrend.data,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
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
                    <h6 className="mb-0">Payment Methods</h6>
                  </Card.Header>
                  <Card.Body>
                    {analytics?.paymentMethods && (
                      <Doughnut
                        data={{
                          labels: Object.keys(analytics.paymentMethods),
                          datasets: [{
                            data: Object.values(analytics.paymentMethods),
                            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
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
        </Tabs>

        {/* Payment Modal */}
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>New Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form className="mb-3">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                      min="1"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select defaultValue="USD">
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Payment description..."
                />
              </Form.Group>
            </Form>
            
            <PaymentForm
              amount={paymentAmount}
              currency="USD"
              description={paymentDescription}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Modal.Body>
        </Modal>

        <style jsx>{`
          .payment-dashboard {
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

          .card-element-container {
            padding: 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            background: white;
          }

          .payment-summary {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
          }

          .plan-item {
            padding: 1rem;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            background: #f8f9fa;
          }

          .dashboard-header {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
      </Container>
    </Elements>
  );
};

export default PaymentDashboard;
