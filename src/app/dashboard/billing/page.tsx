'use client';

import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Subscription {
  plan: string;
  status: string;
  billingCycle: string;
  price: number;
  currency: string;
  nextBillingDate: Date;
  startDate: Date;
  features: string[];
  usage: {
    servicesUsed: number;
    servicesLimit: number;
    storageUsed: number;
    storageLimit: number;
    messagesUsed: number;
    messagesLimit: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: Date;
  description: string;
  paymentMethod: string;
  invoiceId: string;
  receiptUrl: string;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  description: string;
  downloadUrl: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  limits: {
    services: number;
    storage: number;
    messages: number;
  };
  popular: boolean;
}

export default function BillingPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          ...data.subscription,
          nextBillingDate: new Date(data.subscription.nextBillingDate),
          startDate: new Date(data.subscription.startDate)
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/billing/payments?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments.map((p: any) => ({
          ...p,
          date: new Date(p.date)
        })));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices.map((inv: any) => ({
          ...inv,
          issueDate: new Date(inv.issueDate),
          dueDate: new Date(inv.dueDate),
          paidDate: inv.paidDate ? new Date(inv.paidDate) : null
        })));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/billing/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchSubscription(),
        fetchPayments(),
        fetchInvoices(),
        fetchPlans(),
        fetchAnalytics()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSubscription(),
        fetchPayments(),
        fetchInvoices(),
        fetchPlans(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleUpgradePlan = (planId: string) => {
    console.log('Upgrading to plan:', planId);
    // In production, this would integrate with payment processor
    alert(`Upgrading to ${planId} plan - Integration with payment processor needed`);
  };

  const handleUpdatePaymentMethod = () => {
    console.log('Updating payment method');
    // In production, this would open payment method modal
    alert('Payment method update - Integration with payment processor needed');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Downloading invoice:', invoiceId);
    // In production, this would download the actual invoice
    alert(`Downloading invoice ${invoiceId} - File download integration needed`);
  };

  const handleViewReceipt = (paymentId: string) => {
    console.log('Viewing receipt:', paymentId);
    // In production, this would open receipt in new tab
    alert(`Viewing receipt for payment ${paymentId} - Receipt viewer integration needed`);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage your subscription, payments, and billing preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Billing Settings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Notifications</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Payment confirmations</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Invoice reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Usage alerts</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Billing Currency</label>
                <Select defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Save Changes</Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Plans
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your active plan and usage details</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{subscription.plan}</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(subscription.price)}<span className="text-sm text-gray-500">/{subscription.billingCycle}</span>
                        </p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next billing date:</span>
                        <span className="font-medium">{subscription.nextBillingDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Started:</span>
                        <span className="font-medium">{subscription.startDate.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h4 className="font-medium mb-2">Plan Features</h4>
                      <ul className="space-y-1">
                        {subscription.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Overview</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Services</span>
                          <span>{subscription.usage.servicesUsed} / {subscription.usage.servicesLimit}</span>
                        </div>
                        <Progress value={(subscription.usage.servicesUsed / subscription.usage.servicesLimit) * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage</span>
                          <span>{subscription.usage.storageUsed}GB / {subscription.usage.storageLimit}GB</span>
                        </div>
                        <Progress value={(subscription.usage.storageUsed / subscription.usage.storageLimit) * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Messages</span>
                          <span>{subscription.usage.messagesUsed} / {subscription.usage.messagesLimit}</span>
                        </div>
                        <Progress value={(subscription.usage.messagesUsed / subscription.usage.messagesLimit) * 100} className="h-2" />
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button className="w-full" onClick={handleUpdatePaymentMethod}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Update Payment Method
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('plans')}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading subscription details...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.totalSpent.amount)}</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalSpent.period}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.averageMonthly.amount)}</div>
                  <p className="text-xs text-muted-foreground">Per month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.paymentSuccess.rate}%</div>
                  <p className="text-xs text-muted-foreground">{analytics.paymentSuccess.successful}/{analytics.paymentSuccess.total} payments</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Your latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{payment.date.toLocaleDateString()}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('payments')}>
                  View All Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Complete history of your payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <CreditCard className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
                        <p className="text-sm text-gray-500">Invoice: {payment.invoiceId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">{payment.date.toLocaleDateString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(payment.status)}
                        <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(payment.id)}>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Download and manage your invoices</CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Download className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-500">{invoice.description}</p>
                        <p className="text-sm text-gray-500">
                          Issued: {invoice.issueDate.toLocaleDateString()} • 
                          Due: {invoice.dueDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(invoice.status)}
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice.id)}>
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-gray-600 mt-2">Select the perfect plan for your business needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(plan.price)}
                    <span className="text-sm text-gray-500">/{plan.billingCycle}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Services:</span>
                      <span>{plan.limits.services === -1 ? 'Unlimited' : plan.limits.services}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{plan.limits.storage}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Messages:</span>
                      <span>{plan.limits.messages === -1 ? 'Unlimited' : plan.limits.messages}</span>
                    </div>
                  </div>

                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={subscription?.plan === plan.name ? 'outline' : 'default'}
                    disabled={subscription?.plan === plan.name}
                    onClick={() => subscription?.plan !== plan.name && handleUpgradePlan(plan.id)}
                  >
                    {subscription?.plan === plan.name ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
