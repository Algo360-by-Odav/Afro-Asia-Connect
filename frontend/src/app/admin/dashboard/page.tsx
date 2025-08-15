'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Bell, 
  UserCheck, 
  Shield, 
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Database,
  ShoppingCart,
  Globe,
  Building
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// Mock data - replace with real API calls
const userGrowthData = [
  { name: 'Jan', users: 400, buyers: 150, sellers: 120, providers: 130 },
  { name: 'Feb', users: 300, buyers: 120, sellers: 90, providers: 90 },
  { name: 'Mar', users: 500, buyers: 200, sellers: 150, providers: 150 },
  { name: 'Apr', users: 200, buyers: 80, sellers: 60, providers: 60 },
  { name: 'May', users: 600, buyers: 250, sellers: 175, providers: 175 },
  { name: 'Jun', users: 450, buyers: 180, sellers: 135, providers: 135 },
];

const pieData = [
  { name: 'Buyers', value: 3850, color: '#3b82f6' },
  { name: 'Sellers', value: 750, color: '#10b981' },
  { name: 'Service Providers', value: 860, color: '#f59e0b' },
];

const AdminDashboard = () => {
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData] = useState({
    totalUsers: 12540,
    activeListings: 4060,
    dailyVisits: 5200,
    newSignups: 4,
    pendingReviews: 23,
    avgResponseTime: '3.2 hours',
    buyers: 3850,
    sellers: 750,
    serviceProviders: 860
  });

  // Mock users data - replace with real API
  const users = [
    { name: 'Alice Johnson', email: 'alice@example.com', role: 'Buyer', status: 'Active', joinDate: '2024-01-15', lastActive: '2 hours ago' },
    { name: 'Bob Smith', email: 'bob@example.com', role: 'Seller', status: 'Pending', joinDate: '2024-01-20', lastActive: '1 day ago' },
    { name: 'Charlie Brown', email: 'charlie@example.com', role: 'Service Provider', status: 'Active', joinDate: '2024-01-10', lastActive: '30 minutes ago' },
    { name: 'Diana Prince', email: 'diana@example.com', role: 'Buyer', status: 'Inactive', joinDate: '2024-01-05', lastActive: '1 week ago' },
    { name: 'Edward Wilson', email: 'edward@example.com', role: 'Seller', status: 'Active', joinDate: '2024-01-25', lastActive: '5 hours ago' },
  ];

  const filteredUsers = users.filter(u => filter === 'all' || u.role === filter);
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortKey as keyof typeof a] as string;
    const bValue = b[sortKey as keyof typeof b] as string;
    return aValue.localeCompare(bValue);
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'Active': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Inactive': 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      'Buyer': 'bg-blue-100 text-blue-800',
      'Seller': 'bg-green-100 text-green-800',
      'Service Provider': 'bg-purple-100 text-purple-800'
    };
    return variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-5 gap-6 p-6">
        {/* Sidebar */}
        <aside className="col-span-1 bg-[var(--primary-blue)] rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-[var(--accent-gold)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--primary-blue)] font-bold text-lg">A</span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white">AfroAsiaConnect</h2>
              <p className="text-sm text-gray-300">Admin Panel</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <Button 
              variant={activeTab === 'overview' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'overview' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'users' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-4 h-4 mr-3" />
              Users
            </Button>
            <Button 
              variant={activeTab === 'listings' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'listings' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('listings')}
            >
              <ShoppingCart className="w-4 h-4 mr-3" />
              Listings
            </Button>
            <Button 
              variant={activeTab === 'requests' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'requests' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('requests')}
            >
              <FileText className="w-4 h-4 mr-3" />
              Requests
            </Button>
            <Button 
              variant={activeTab === 'compliance' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'compliance' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('compliance')}
            >
              <Shield className="w-4 h-4 mr-3" />
              Compliance
            </Button>
            <Button 
              variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'analytics' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Analytics
            </Button>
            <Button 
              variant={activeTab === 'notifications' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'notifications' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="w-4 h-4 mr-3" />
              Notifications
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'ghost'} 
              className={`w-full justify-start ${activeTab === 'settings' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)] hover:bg-[var(--accent-gold)]/90' : 'text-white hover:bg-white/10 hover:text-white'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="col-span-4 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and monitor your AfroAsiaConnect platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.totalUsers.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Buyers {dashboardData.buyers} • Sellers {dashboardData.sellers}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Listings</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.activeListings.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Products {dashboardData.serviceProviders} • Services
                        </p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Daily Visits</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.dailyVisits.toLocaleString()}</p>
                        <p className="text-sm text-green-600 mt-1">↑ 12% from yesterday</p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">New Signups Today</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.newSignups}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Pending reviews {dashboardData.pendingReviews} • {dashboardData.avgResponseTime}
                        </p>
                      </div>
                      <UserCheck className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Over Time</CardTitle>
                    <CardDescription>Monthly user registration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userGrowthData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Breakdown by user type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [value.toLocaleString(), name]} 
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-6 mt-4">
                      {pieData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          ></div>
                          <span className="text-sm text-gray-600">{item.name}: {item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage and monitor all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <select 
                      onChange={(e) => setFilter(e.target.value)} 
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      title="Filter users by role"
                      aria-label="Filter users by role"
                    >
                      <option value="all">All Roles</option>
                      <option value="Buyer">Buyers</option>
                      <option value="Seller">Sellers</option>
                      <option value="Service Provider">Service Providers</option>
                    </select>
                    <select 
                      onChange={(e) => setSortKey(e.target.value)} 
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      title="Sort users by criteria"
                      aria-label="Sort users by criteria"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="role">Sort by Role</option>
                      <option value="status">Sort by Status</option>
                      <option value="joinDate">Sort by Join Date</option>
                    </select>
                  </div>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-4 font-medium text-gray-900">User</th>
                        <th className="text-left p-4 font-medium text-gray-900">Role</th>
                        <th className="text-left p-4 font-medium text-gray-900">Status</th>
                        <th className="text-left p-4 font-medium text-gray-900">Join Date</th>
                        <th className="text-left p-4 font-medium text-gray-900">Last Active</th>
                        <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleBadge(user.role)}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusBadge(user.status)}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{user.joinDate}</td>
                          <td className="p-4 text-sm text-gray-600">{user.lastActive}</td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">View</Button>
                              <Button variant="outline" size="sm">Edit</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {/* Listings Stats */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Listings</p>
                        <p className="text-3xl font-bold text-gray-900">4,060</p>
                        <p className="text-sm text-green-600 mt-1">↑ 8% from last month</p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Products</p>
                        <p className="text-3xl font-bold text-gray-900">2,840</p>
                        <p className="text-sm text-gray-500 mt-1">70% of total</p>
                      </div>
                      <Building className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Services</p>
                        <p className="text-3xl font-bold text-gray-900">1,220</p>
                        <p className="text-sm text-gray-500 mt-1">30% of total</p>
                      </div>
                      <Settings className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Review</p>
                        <p className="text-3xl font-bold text-gray-900">156</p>
                        <p className="text-sm text-orange-600 mt-1">Needs attention</p>
                      </div>
                      <FileText className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Listings Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Listings Management</CardTitle>
                  <CardDescription>Monitor and manage all platform listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by type"
                        aria-label="Filter by type"
                      >
                        <option value="all">All Types</option>
                        <option value="product">Products</option>
                        <option value="service">Services</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by status"
                        aria-label="Filter by status"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending Review</option>
                        <option value="suspended">Suspended</option>
                        <option value="expired">Expired</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search listings..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                      <Button size="sm">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add Listing
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-4 font-medium text-gray-900">Listing</th>
                          <th className="text-left p-4 font-medium text-gray-900">Type</th>
                          <th className="text-left p-4 font-medium text-gray-900">Provider</th>
                          <th className="text-left p-4 font-medium text-gray-900">Category</th>
                          <th className="text-left p-4 font-medium text-gray-900">Status</th>
                          <th className="text-left p-4 font-medium text-gray-900">Price</th>
                          <th className="text-left p-4 font-medium text-gray-900">Created</th>
                          <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            title: "Premium Web Development Service",
                            type: "Service",
                            provider: "TechSolutions Ltd",
                            category: "Technology",
                            status: "Active",
                            price: "$2,500",
                            created: "2024-01-15",
                            image: "/api/placeholder/60/60"
                          },
                          {
                            title: "Organic Coffee Beans - Premium Grade",
                            type: "Product",
                            provider: "AfriCoffee Co.",
                            category: "Agriculture",
                            status: "Active",
                            price: "$45/kg",
                            created: "2024-01-20",
                            image: "/api/placeholder/60/60"
                          },
                          {
                            title: "Digital Marketing Consultation",
                            type: "Service",
                            provider: "MarketPro Agency",
                            category: "Marketing",
                            status: "Pending",
                            price: "$150/hr",
                            created: "2024-01-25",
                            image: "/api/placeholder/60/60"
                          },
                          {
                            title: "Handcrafted Textiles Collection",
                            type: "Product",
                            provider: "Heritage Crafts",
                            category: "Fashion",
                            status: "Active",
                            price: "$80-$200",
                            created: "2024-01-18",
                            image: "/api/placeholder/60/60"
                          },
                          {
                            title: "Business Consulting Services",
                            type: "Service",
                            provider: "ConsultCorp",
                            category: "Business",
                            status: "Suspended",
                            price: "$300/hr",
                            created: "2024-01-10",
                            image: "/api/placeholder/60/60"
                          }
                        ].map((listing, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                                  <ShoppingCart className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{listing.title}</p>
                                  <p className="text-sm text-gray-500">ID: #{1000 + i}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={listing.type === 'Product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                {listing.type}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{listing.provider}</p>
                                <p className="text-sm text-gray-500">Verified</p>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{listing.category}</td>
                            <td className="p-4">
                              <Badge className={
                                listing.status === 'Active' ? 'bg-green-100 text-green-800' :
                                listing.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {listing.status}
                              </Badge>
                            </td>
                            <td className="p-4 font-medium text-gray-900">{listing.price}</td>
                            <td className="p-4 text-sm text-gray-600">{listing.created}</td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  Suspend
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">Showing 1-5 of 4,060 listings</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" className="bg-[var(--primary-blue)] text-white">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {/* Compliance Stats */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">KYC Submissions</p>
                        <p className="text-3xl font-bold text-gray-900">156</p>
                        <p className="text-sm text-orange-600 mt-1">Pending review</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Business Certifications</p>
                        <p className="text-3xl font-bold text-gray-900">89</p>
                        <p className="text-sm text-green-600 mt-1">Verified</p>
                      </div>
                      <Building className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Trade Licenses</p>
                        <p className="text-3xl font-bold text-gray-900">234</p>
                        <p className="text-sm text-blue-600 mt-1">Active</p>
                      </div>
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                        <p className="text-3xl font-bold text-gray-900">94.2%</p>
                        <p className="text-sm text-green-600 mt-1">↑ 2.1% this month</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Document Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>Review and manage compliance documents and certifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by document type"
                        aria-label="Filter by document type"
                      >
                        <option value="all">All Document Types</option>
                        <option value="kyc">KYC Documents</option>
                        <option value="business_cert">Business Certifications</option>
                        <option value="trade_license">Trade Licenses</option>
                        <option value="tax_documents">Tax Documents</option>
                        <option value="insurance">Insurance Documents</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by status"
                        aria-label="Filter by status"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="expiring_soon">Expiring Soon</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by urgency"
                        aria-label="Filter by urgency"
                      >
                        <option value="all">All Urgency</option>
                        <option value="urgent">Urgent</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low Priority</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Export Report
                      </Button>
                      <Button size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Bulk Review
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-4 font-medium text-gray-900">Document</th>
                          <th className="text-left p-4 font-medium text-gray-900">Type</th>
                          <th className="text-left p-4 font-medium text-gray-900">Company</th>
                          <th className="text-left p-4 font-medium text-gray-900">Status</th>
                          <th className="text-left p-4 font-medium text-gray-900">Submitted</th>
                          <th className="text-left p-4 font-medium text-gray-900">Expiry</th>
                          <th className="text-left p-4 font-medium text-gray-900">Urgency</th>
                          <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            id: "DOC-2024-001",
                            name: "Business Registration Certificate",
                            type: "Business Certification",
                            company: "TechSolutions Ltd",
                            contact: "alice@techsolutions.com",
                            status: "Pending",
                            submitted: "2024-01-28",
                            expiry: "2025-01-28",
                            urgency: "Normal",
                            size: "2.4 MB"
                          },
                          {
                            id: "DOC-2024-002",
                            name: "Tax Identification Number",
                            type: "Tax Documents",
                            company: "AfriCoffee Co.",
                            contact: "info@africoffee.com",
                            status: "Approved",
                            submitted: "2024-01-25",
                            expiry: "2024-12-31",
                            urgency: "Urgent",
                            size: "1.8 MB"
                          },
                          {
                            id: "DOC-2024-003",
                            name: "Import/Export License",
                            type: "Trade License",
                            company: "GlobalTrade Inc.",
                            contact: "licensing@globaltrade.com",
                            status: "Expiring Soon",
                            submitted: "2023-12-15",
                            expiry: "2024-02-15",
                            urgency: "Urgent",
                            size: "3.1 MB"
                          },
                          {
                            id: "DOC-2024-004",
                            name: "KYC Identity Verification",
                            type: "KYC Documents",
                            company: "Heritage Crafts",
                            contact: "admin@heritagecrafts.com",
                            status: "Rejected",
                            submitted: "2024-01-20",
                            expiry: "N/A",
                            urgency: "Normal",
                            size: "4.2 MB"
                          },
                          {
                            id: "DOC-2024-005",
                            name: "Professional Liability Insurance",
                            type: "Insurance",
                            company: "ConsultCorp",
                            contact: "insurance@consultcorp.com",
                            status: "Approved",
                            submitted: "2024-01-18",
                            expiry: "2025-01-18",
                            urgency: "Low",
                            size: "1.5 MB"
                          }
                        ].map((doc, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg mr-3 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-sm text-gray-500">{doc.id} • {doc.size}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                doc.type === 'Business Certification' ? 'bg-green-100 text-green-800' :
                                doc.type === 'Tax Documents' ? 'bg-blue-100 text-blue-800' :
                                doc.type === 'Trade License' ? 'bg-purple-100 text-purple-800' :
                                doc.type === 'KYC Documents' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {doc.type}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{doc.company}</p>
                                <p className="text-sm text-gray-500">{doc.contact}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                doc.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                doc.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                doc.status === 'Expiring Soon' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {doc.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{doc.submitted}</td>
                            <td className="p-4">
                              <div>
                                <p className="text-sm text-gray-900">{doc.expiry}</p>
                                {doc.urgency === 'Urgent' && (
                                  <p className="text-xs text-red-600">Expires soon!</p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                doc.urgency === 'Urgent' ? 'bg-red-100 text-red-800' :
                                doc.urgency === 'Normal' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {doc.urgency}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">Showing 1-5 of 479 documents</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" className="bg-[var(--primary-blue)] text-white">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Overview */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">$2.4M</p>
                        <p className="text-sm text-green-600 mt-1">↑ 18.2% from last month</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                        <p className="text-3xl font-bold text-gray-900">8,432</p>
                        <p className="text-sm text-blue-600 mt-1">↑ 12.5% from yesterday</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                        <p className="text-3xl font-bold text-gray-900">3.8%</p>
                        <p className="text-sm text-green-600 mt-1">↑ 0.4% improvement</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Session Duration</p>
                        <p className="text-3xl font-bold text-gray-900">12.4m</p>
                        <p className="text-sm text-green-600 mt-1">↑ 2.1m increase</p>
                      </div>
                      <Activity className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly revenue performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { month: 'Aug', revenue: 180000, transactions: 1200 },
                        { month: 'Sep', revenue: 220000, transactions: 1450 },
                        { month: 'Oct', revenue: 195000, transactions: 1320 },
                        { month: 'Nov', revenue: 240000, transactions: 1600 },
                        { month: 'Dec', revenue: 280000, transactions: 1850 },
                        { month: 'Jan', revenue: 320000, transactions: 2100 }
                      ]}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number, name) => [
                          name === 'revenue' ? `$${(Number(value) / 1000).toFixed(0)}K` : value,
                          name === 'revenue' ? 'Revenue' : 'Transactions'
                        ]} />
                        <Bar dataKey="revenue" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                    <CardDescription>Where your users are coming from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Direct', value: 4200, color: '#3b82f6' },
                            { name: 'Search Engines', value: 3100, color: '#10b981' },
                            { name: 'Social Media', value: 2800, color: '#f59e0b' },
                            { name: 'Referrals', value: 1900, color: '#ef4444' },
                            { name: 'Email', value: 1200, color: '#8b5cf6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {[
                            { name: 'Direct', value: 4200, color: '#3b82f6' },
                            { name: 'Search Engines', value: 3100, color: '#10b981' },
                            { name: 'Social Media', value: 2800, color: '#f59e0b' },
                            { name: 'Referrals', value: 1900, color: '#ef4444' },
                            { name: 'Email', value: 1200, color: '#8b5cf6' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Visitors']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                      {[
                        { name: 'Direct', value: 4200, color: '#3b82f6' },
                        { name: 'Search Engines', value: 3100, color: '#10b981' },
                        { name: 'Social Media', value: 2800, color: '#f59e0b' },
                        { name: 'Referrals', value: 1900, color: '#ef4444' },
                        { name: 'Email', value: 1200, color: '#8b5cf6' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          ></div>
                          <span className="text-sm text-gray-600">{item.name}: {item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Categories</CardTitle>
                    <CardDescription>Most popular service categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { category: 'Technology Services', bookings: 1240, revenue: '$485K', growth: '+15%' },
                        { category: 'Agriculture Products', bookings: 980, revenue: '$320K', growth: '+8%' },
                        { category: 'Manufacturing', bookings: 750, revenue: '$280K', growth: '+12%' },
                        { category: 'Consulting', bookings: 620, revenue: '$195K', growth: '+5%' },
                        { category: 'Fashion & Textiles', bookings: 450, revenue: '$140K', growth: '+18%' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.category}</p>
                            <p className="text-sm text-gray-500">{item.bookings} bookings</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{item.revenue}</p>
                            <p className="text-sm text-green-600">{item.growth}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Users by region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { country: 'Nigeria', users: 3240, percentage: '28%', flag: '🇳🇬' },
                        { country: 'South Africa', users: 2180, percentage: '19%', flag: '🇿🇦' },
                        { country: 'Kenya', users: 1950, percentage: '17%', flag: '🇰🇪' },
                        { country: 'Ghana', users: 1420, percentage: '12%', flag: '🇬🇭' },
                        { country: 'Singapore', users: 980, percentage: '8%', flag: '🇸🇬' },
                        { country: 'Others', users: 1870, percentage: '16%', flag: '🌍' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{item.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{item.country}</p>
                              <p className="text-sm text-gray-500">{item.users.toLocaleString()} users</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{item.percentage}</p>
                            <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: item.percentage }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest platform activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { 
                          action: 'New user registration',
                          details: 'TechCorp Solutions joined',
                          time: '2 minutes ago',
                          type: 'user',
                          icon: <Users className="w-4 h-4" />
                        },
                        {
                          action: 'Service booking completed',
                          details: 'Web development project',
                          time: '15 minutes ago',
                          type: 'booking',
                          icon: <CheckCircle className="w-4 h-4" />
                        },
                        {
                          action: 'New listing published',
                          details: 'Organic coffee beans',
                          time: '1 hour ago',
                          type: 'listing',
                          icon: <FileText className="w-4 h-4" />
                        },
                        {
                          action: 'Payment processed',
                          details: '$2,500 transaction',
                          time: '2 hours ago',
                          type: 'payment',
                          icon: <TrendingUp className="w-4 h-4" />
                        },
                        {
                          action: 'Document verified',
                          details: 'Business certification',
                          time: '3 hours ago',
                          type: 'verification',
                          icon: <Shield className="w-4 h-4" />
                        }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${
                            activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'booking' ? 'bg-green-100 text-green-600' :
                            activity.type === 'listing' ? 'bg-purple-100 text-purple-600' :
                            activity.type === 'payment' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-500">{activity.details}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Notification Stats */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                        <p className="text-3xl font-bold text-gray-900">1,847</p>
                        <p className="text-sm text-blue-600 mt-1">↑ 23 today</p>
                      </div>
                      <Bell className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Unread</p>
                        <p className="text-3xl font-bold text-gray-900">47</p>
                        <p className="text-sm text-orange-600 mt-1">Needs attention</p>
                      </div>
                      <Bell className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                        <p className="text-3xl font-bold text-gray-900">8</p>
                        <p className="text-sm text-red-600 mt-1">Urgent action required</p>
                      </div>
                      <Bell className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Rate</p>
                        <p className="text-3xl font-bold text-gray-900">92%</p>
                        <p className="text-sm text-green-600 mt-1">↑ 3% this week</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notification Management */}
              <Card>
                <CardHeader>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>Recent platform activities and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by type"
                        aria-label="Filter by type"
                      >
                        <option value="all">All Types</option>
                        <option value="user">User Activities</option>
                        <option value="system">System Alerts</option>
                        <option value="security">Security</option>
                        <option value="payment">Payments</option>
                        <option value="compliance">Compliance</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by priority"
                        aria-label="Filter by priority"
                      >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by status"
                        aria-label="Filter by status"
                      >
                        <option value="all">All Status</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="archived">Archived</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Mark All Read
                      </Button>
                      <Button size="sm">
                        <Bell className="w-4 h-4 mr-2" />
                        Send Notification
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        id: 'NOTIF-001',
                        type: 'Security',
                        priority: 'Critical',
                        title: 'Multiple failed login attempts detected',
                        message: 'Unusual login activity detected from IP 192.168.1.100 for user admin@afroasiaconnect.com',
                        time: '2 minutes ago',
                        status: 'Unread',
                        icon: <Shield className="w-5 h-5" />,
                        bgColor: 'bg-red-50',
                        iconColor: 'text-red-600',
                        borderColor: 'border-red-200'
                      },
                      {
                        id: 'NOTIF-002',
                        type: 'User',
                        priority: 'Medium',
                        title: 'New user registered',
                        message: 'Alice Johnson joined as a Buyer from Nigeria',
                        time: '15 minutes ago',
                        status: 'Unread',
                        icon: <UserCheck className="w-5 h-5" />,
                        bgColor: 'bg-blue-50',
                        iconColor: 'text-blue-600',
                        borderColor: 'border-blue-200'
                      },
                      {
                        id: 'NOTIF-003',
                        type: 'Compliance',
                        priority: 'High',
                        title: 'Document verification required',
                        message: 'Business certificate for TechSolutions Ltd expires in 7 days',
                        time: '1 hour ago',
                        status: 'Unread',
                        icon: <FileText className="w-5 h-5" />,
                        bgColor: 'bg-orange-50',
                        iconColor: 'text-orange-600',
                        borderColor: 'border-orange-200'
                      },
                      {
                        id: 'NOTIF-004',
                        type: 'Payment',
                        priority: 'Medium',
                        title: 'Large transaction processed',
                        message: '$15,000 payment processed for GlobalTrade Inc. partnership agreement',
                        time: '2 hours ago',
                        status: 'Read',
                        icon: <TrendingUp className="w-5 h-5" />,
                        bgColor: 'bg-green-50',
                        iconColor: 'text-green-600',
                        borderColor: 'border-green-200'
                      },
                      {
                        id: 'NOTIF-005',
                        type: 'System',
                        priority: 'Low',
                        title: 'System maintenance completed',
                        message: 'Scheduled database maintenance completed successfully at 02:00 AM',
                        time: '4 hours ago',
                        status: 'Read',
                        icon: <Settings className="w-5 h-5" />,
                        bgColor: 'bg-gray-50',
                        iconColor: 'text-gray-600',
                        borderColor: 'border-gray-200'
                      },
                      {
                        id: 'NOTIF-006',
                        type: 'User',
                        priority: 'Medium',
                        title: 'Service request approved',
                        message: 'Web development service listing for Bob Smith has been approved',
                        time: '6 hours ago',
                        status: 'Read',
                        icon: <CheckCircle className="w-5 h-5" />,
                        bgColor: 'bg-green-50',
                        iconColor: 'text-green-600',
                        borderColor: 'border-green-200'
                      },
                      {
                        id: 'NOTIF-007',
                        type: 'Security',
                        priority: 'High',
                        title: 'Suspicious activity detected',
                        message: 'Unusual API access pattern detected from third-party integration',
                        time: '8 hours ago',
                        status: 'Read',
                        icon: <Shield className="w-5 h-5" />,
                        bgColor: 'bg-yellow-50',
                        iconColor: 'text-yellow-600',
                        borderColor: 'border-yellow-200'
                      }
                    ].map((notification, index) => (
                      <div key={index} className={`flex items-start p-4 rounded-lg border ${notification.bgColor} ${notification.borderColor} ${notification.status === 'Unread' ? 'shadow-sm' : ''}`}>
                        <div className={`p-2 rounded-full ${notification.iconColor} ${notification.status === 'Unread' ? 'bg-white' : 'bg-white/50'} mr-4`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-medium ${notification.status === 'Unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h3>
                              <Badge className={
                                notification.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                notification.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                notification.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {notification.priority}
                              </Badge>
                              <Badge className={
                                notification.type === 'Security' ? 'bg-red-100 text-red-800' :
                                notification.type === 'User' ? 'bg-blue-100 text-blue-800' :
                                notification.type === 'Compliance' ? 'bg-orange-100 text-orange-800' :
                                notification.type === 'Payment' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {notification.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{notification.time}</span>
                              {notification.status === 'Unread' && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm ${notification.status === 'Unread' ? 'text-gray-700' : 'text-gray-600'} mb-2`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">View Details</Button>
                            {notification.status === 'Unread' && (
                              <Button variant="outline" size="sm">Mark as Read</Button>
                            )}
                            <Button variant="outline" size="sm" className="text-gray-500">Archive</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">Showing 1-7 of 1,847 notifications</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" className="bg-[var(--primary-blue)] text-white">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Requests Stats */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Requests</p>
                        <p className="text-3xl font-bold text-gray-900">1,247</p>
                        <p className="text-sm text-blue-600 mt-1">↑ 15% this week</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Review</p>
                        <p className="text-3xl font-bold text-gray-900">89</p>
                        <p className="text-sm text-orange-600 mt-1">Needs attention</p>
                      </div>
                      <FileText className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Approved Today</p>
                        <p className="text-3xl font-bold text-gray-900">23</p>
                        <p className="text-sm text-green-600 mt-1">Processing time: 2.1h</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rejected</p>
                        <p className="text-3xl font-bold text-gray-900">12</p>
                        <p className="text-sm text-red-600 mt-1">Requires resubmission</p>
                      </div>
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Requests Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Requests Management</CardTitle>
                  <CardDescription>Review and manage all platform service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by request type"
                        aria-label="Filter by request type"
                      >
                        <option value="all">All Request Types</option>
                        <option value="service_booking">Service Bookings</option>
                        <option value="product_inquiry">Product Inquiries</option>
                        <option value="partnership">Partnership Requests</option>
                        <option value="verification">Verification Requests</option>
                        <option value="support">Support Tickets</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by status"
                        aria-label="Filter by status"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="in_progress">In Progress</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        title="Filter by priority"
                        aria-label="Filter by priority"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search requests..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Export Report
                      </Button>
                      <Button size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-4 font-medium text-gray-900">Request ID</th>
                          <th className="text-left p-4 font-medium text-gray-900">Type</th>
                          <th className="text-left p-4 font-medium text-gray-900">Requester</th>
                          <th className="text-left p-4 font-medium text-gray-900">Subject</th>
                          <th className="text-left p-4 font-medium text-gray-900">Priority</th>
                          <th className="text-left p-4 font-medium text-gray-900">Status</th>
                          <th className="text-left p-4 font-medium text-gray-900">Created</th>
                          <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            id: "REQ-2024-001",
                            type: "Service Booking",
                            requester: "Alice Johnson",
                            email: "alice@techcorp.com",
                            subject: "Web Development Service Request",
                            priority: "High",
                            status: "Pending",
                            created: "2024-01-28",
                            description: "Requesting premium web development service for e-commerce platform"
                          },
                          {
                            id: "REQ-2024-002",
                            type: "Product Inquiry",
                            requester: "Bob Smith",
                            email: "bob@tradeco.com",
                            subject: "Bulk Coffee Bean Purchase",
                            priority: "Medium",
                            status: "In Progress",
                            created: "2024-01-27",
                            description: "Inquiry about bulk purchase of organic coffee beans"
                          },
                          {
                            id: "REQ-2024-003",
                            type: "Partnership",
                            requester: "Carol Williams",
                            email: "carol@globalltd.com",
                            subject: "Strategic Partnership Proposal",
                            priority: "High",
                            status: "Approved",
                            created: "2024-01-26",
                            description: "Partnership proposal for expanding into Asian markets"
                          },
                          {
                            id: "REQ-2024-004",
                            type: "Verification",
                            requester: "David Chen",
                            email: "david@craftworks.com",
                            subject: "Business Verification Request",
                            priority: "Medium",
                            status: "Pending",
                            created: "2024-01-25",
                            description: "Request for business verification and certification"
                          },
                          {
                            id: "REQ-2024-005",
                            type: "Support",
                            requester: "Emma Davis",
                            email: "emma@startupco.com",
                            subject: "Account Access Issue",
                            priority: "Low",
                            status: "Completed",
                            created: "2024-01-24",
                            description: "Unable to access dashboard after password reset"
                          }
                        ].map((request, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{request.id}</p>
                                <p className="text-sm text-gray-500">{request.created}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                request.type === 'Service Booking' ? 'bg-blue-100 text-blue-800' :
                                request.type === 'Product Inquiry' ? 'bg-green-100 text-green-800' :
                                request.type === 'Partnership' ? 'bg-purple-100 text-purple-800' :
                                request.type === 'Verification' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {request.type}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{request.requester}</p>
                                <p className="text-sm text-gray-500">{request.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{request.subject}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">{request.description}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                request.priority === 'High' ? 'bg-red-100 text-red-800' :
                                request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {request.priority}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {request.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{request.created}</td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">Showing 1-5 of 1,247 requests</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" className="bg-[var(--primary-blue)] text-white">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Settings Overview */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Configurations</p>
                        <p className="text-3xl font-bold text-gray-900">24</p>
                        <p className="text-sm text-green-600 mt-1">All systems operational</p>
                      </div>
                      <Settings className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Security Level</p>
                        <p className="text-3xl font-bold text-gray-900">High</p>
                        <p className="text-sm text-blue-600 mt-1">Enhanced protection</p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                        <p className="text-3xl font-bold text-gray-900">47</p>
                        <p className="text-sm text-green-600 mt-1">All active</p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Backup</p>
                        <p className="text-3xl font-bold text-gray-900">2h</p>
                        <p className="text-sm text-green-600 mt-1">Successful</p>
                      </div>
                      <Database className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Sections */}
              <div className="grid grid-cols-2 gap-6">
                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic platform configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                      <input
                        type="text"
                        defaultValue="AfroAsiaConnect"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
                      <textarea
                        defaultValue="Connecting Africa and Asia through trade and services"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Default language selection"
                        title="Select the default platform language"
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="ar">Arabic</option>
                        <option value="zh">Chinese</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Time zone selection"
                        title="Select the platform time zone"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Maintenance Mode</p>
                        <p className="text-sm text-gray-500">Enable platform maintenance mode</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Platform security configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Session timeout in minutes"
                        title="Session timeout duration in minutes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password Policy</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Password policy selection"
                        title="Select the password complexity requirements"
                      >
                        <option value="standard">Standard (8+ characters)</option>
                        <option value="strong">Strong (12+ chars, mixed case, numbers)</option>
                        <option value="enterprise">Enterprise (16+ chars, special chars)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Login Attempt Limit</p>
                        <p className="text-sm text-gray-500">Lock account after failed attempts</p>
                      </div>
                      <input
                        type="number"
                        defaultValue="5"
                        className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Login attempt limit"
                        title="Number of failed login attempts before account lockout"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">IP Whitelist</p>
                        <p className="text-sm text-gray-500">Restrict admin access by IP</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-3 gap-6">
                {/* Email Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>SMTP and email settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server</label>
                      <input
                        type="text"
                        defaultValue="smtp.afroasiaconnect.com"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                      <input
                        type="number"
                        defaultValue="587"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                      <input
                        type="email"
                        defaultValue="noreply@afroasiaconnect.com"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">SSL/TLS</p>
                        <p className="text-sm text-gray-500">Enable encryption</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <Button className="w-full" variant="outline">Test Email Connection</Button>
                  </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Configuration</CardTitle>
                    <CardDescription>Payment gateway settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                        <option value="SGD">SGD - Singapore Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue="2.5"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        aria-label="Commission rate percentage"
                        title="Platform commission rate as a percentage"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Stripe Gateway</p>
                        <p className="text-sm text-gray-500">Enable Stripe payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">PayPal Gateway</p>
                        <p className="text-sm text-gray-500">Enable PayPal payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <Button className="w-full" variant="outline">Test Payment Gateway</Button>
                  </CardContent>
                </Card>

                {/* API Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>API access and rate limiting</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (req/min)</label>
                      <input
                        type="number"
                        defaultValue="1000"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Version</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="v1">Version 1.0</option>
                        <option value="v2">Version 2.0 (Beta)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">API Documentation</p>
                        <p className="text-sm text-gray-500">Public API docs</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">CORS Policy</p>
                        <p className="text-sm text-gray-500">Cross-origin requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <Button className="w-full" variant="outline">Generate API Key</Button>
                  </CardContent>
                </Card>
              </div>

              {/* System Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring & Backup</CardTitle>
                  <CardDescription>System health and data backup configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Monitoring Settings</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">System Health Monitoring</p>
                          <p className="text-sm text-gray-500">Monitor CPU, memory, and disk usage</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold (%)</label>
                        <input
                          type="number"
                          defaultValue="85"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
                        <input
                          type="number"
                          defaultValue="30"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Backup Settings</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          aria-label="Backup frequency selection"
                          title="Select how often backups should be created"
                        >
                          <option value="hourly">Every Hour</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                        <input
                          type="number"
                          defaultValue="7"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button className="flex-1" variant="outline">Create Backup Now</Button>
                        <Button className="flex-1" variant="outline">Restore from Backup</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Settings */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline">Reset to Defaults</Button>
                <Button className="bg-[var(--primary-blue)] text-white">Save All Settings</Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
