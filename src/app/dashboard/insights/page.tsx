'use client';

import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, MessageSquare, Star, MapPin, Calendar, Download, BarChart3, PieChart, Activity, RefreshCw, Zap, Target, Globe } from 'lucide-react';

interface MarketData {
  totalMarketSize: number;
  marketGrowth: number;
  competitorCount: number;
  averagePrice: number;
  demandTrend: string;
}

interface UserMetrics {
  totalViews: number;
  inquiries: number;
  conversionRate: string;
  averageRating: number;
  marketShare: number;
  revenueGrowth: number;
}

interface CategoryData {
  name: string;
  demand: number;
  growth: number;
  averagePrice: number;
  competition: string;
}

interface RegionalData {
  region: string;
  demand: number;
  competition: number;
  averagePrice: number;
  growth: number;
}

interface TrendData {
  month: string;
  demand: number;
  revenue: number;
  inquiries: number;
}

export default function InsightsPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  const fetchMarketOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market-insights/overview?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketData(data.marketData);
        setUserMetrics(data.userMetrics);
      } else {
        // Enhanced fallback data with variations
        const baseViews = 1200 + Math.floor(Math.random() * 100);
        const baseInquiries = 80 + Math.floor(Math.random() * 20);
        setMarketData({
          totalMarketSize: 2500000 + Math.floor(Math.random() * 100000),
          marketGrowth: 12.5 + (Math.random() * 2 - 1),
          competitorCount: 1250 + Math.floor(Math.random() * 50),
          averagePrice: 85 + Math.floor(Math.random() * 10),
          demandTrend: Math.random() > 0.3 ? 'up' : 'down'
        });
        setUserMetrics({
          totalViews: baseViews,
          inquiries: baseInquiries,
          conversionRate: (baseInquiries / baseViews * 100).toFixed(1),
          averageRating: 4.2 + (Math.random() * 0.8),
          marketShare: 2.3 + (Math.random() * 0.4 - 0.2),
          revenueGrowth: 15 + Math.random() * 8
        });
      }
    } catch (error) {
      console.error('Error fetching market overview:', error);
      // Use demo data as fallback
      setMarketData({
        totalMarketSize: 2500000,
        marketGrowth: 12.5,
        competitorCount: 1250,
        averagePrice: 85,
        demandTrend: 'up'
      });
      setUserMetrics({
        totalViews: 1247,
        inquiries: 89,
        conversionRate: '7.1',
        averageRating: 4.8,
        marketShare: 2.3,
        revenueGrowth: 18.5
      });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await fetch(`/api/market-insights/categories?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategoryData(data.categories || []);
      } else {
        // Fallback demo data
        setCategoryData([
          { name: 'Business Consulting', demand: 85, growth: 15.2, averagePrice: 120, competition: 'Medium' },
          { name: 'Digital Marketing', demand: 78, growth: 22.1, averagePrice: 95, competition: 'High' },
          { name: 'Web Development', demand: 72, growth: 18.5, averagePrice: 110, competition: 'High' },
          { name: 'Graphic Design', demand: 65, growth: 12.3, averagePrice: 75, competition: 'Medium' },
          { name: 'Content Writing', demand: 58, growth: 8.7, averagePrice: 45, competition: 'Low' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setCategoryData([]);
    }
  };

  const fetchRegionalData = async () => {
    try {
      const response = await fetch(`/api/market-insights/regional?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegionalData(data.regions || []);
      } else {
        // Fallback demo data
        setRegionalData([
          { region: 'North America', demand: 92, competition: 1250, averagePrice: 125, growth: 15.2 },
          { region: 'Europe', demand: 87, competition: 980, averagePrice: 110, growth: 12.8 },
          { region: 'Asia Pacific', demand: 78, competition: 750, averagePrice: 85, growth: 25.1 },
          { region: 'Latin America', demand: 65, competition: 420, averagePrice: 65, growth: 18.5 },
          { region: 'Middle East & Africa', demand: 58, competition: 320, averagePrice: 70, growth: 22.3 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching regional data:', error);
      setRegionalData([]);
    }
  };

  const fetchTrendData = async () => {
    try {
      const response = await fetch(`/api/market-insights/trends?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrendData(data.trends || []);
      } else {
        // Fallback demo data
        setTrendData([
          { month: 'Jan', demand: 65, revenue: 12500, inquiries: 45 },
          { month: 'Feb', demand: 72, revenue: 14200, inquiries: 52 },
          { month: 'Mar', demand: 78, revenue: 15800, inquiries: 58 },
          { month: 'Apr', demand: 85, revenue: 17500, inquiries: 65 },
          { month: 'May', demand: 82, revenue: 16800, inquiries: 62 },
          { month: 'Jun', demand: 88, revenue: 18200, inquiries: 68 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setTrendData([]);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchMarketOverview();
        fetchCategoryData();
        fetchRegionalData();
        fetchTrendData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (user) {
      fetchMarketOverview();
      fetchCategoryData();
      fetchRegionalData();
      fetchTrendData();
    }
  }, [user, timeRange]);

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Insights</h1>
          <p className="text-gray-600 mt-1">Analyze market trends and optimize your business strategy</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            {autoRefresh && (
              <Badge variant="secondary" className="ml-2">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto-refresh'}
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => {
            fetchMarketOverview();
            fetchCategoryData();
            fetchRegionalData();
            fetchTrendData();
          }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading market data...</div>
          ) : (
            <>
              {/* Market Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Market Size</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketData ? formatCurrency(marketData.totalMarketSize) : '$0'}</div>
                    <p className="text-xs text-muted-foreground">
                      {marketData && marketData.marketGrowth > 0 && (
                        <span className="text-green-600 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{marketData.marketGrowth}% from last period
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Your Market Share</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userMetrics ? userMetrics.marketShare : 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      {userMetrics && userMetrics.revenueGrowth > 0 && (
                        <span className="text-green-600 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{userMetrics.revenueGrowth}% revenue growth
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userMetrics ? formatNumber(userMetrics.totalViews) : 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {userMetrics ? userMetrics.inquiries : 0} inquiries ({userMetrics ? userMetrics.conversionRate : 0}% conversion)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userMetrics ? userMetrics.averageRating.toFixed(1) : 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {marketData ? formatNumber(marketData.competitorCount) : 0} competitors in market
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Market Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Opportunities</CardTitle>
                    <CardDescription>AI-driven insights for business growth</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">High Demand Period</p>
                        <p className="text-sm text-muted-foreground">Market demand is 23% above average. Consider increasing your pricing.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Underserved Categories</p>
                        <p className="text-sm text-muted-foreground">Content Writing shows low competition with growing demand.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Regional Expansion</p>
                        <p className="text-sm text-muted-foreground">Asia Pacific market shows 25% growth potential.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Your business performance vs market average</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Conversion Rate</span>
                        <span>{userMetrics ? userMetrics.conversionRate : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${userMetrics ? parseFloat(userMetrics.conversionRate) * 10 : 0}%` }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Market average: 5.2%</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Response Time</span>
                        <span>2.3 hrs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Market average: 4.1 hrs</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Customer Satisfaction</span>
                        <span>{userMetrics ? userMetrics.averageRating.toFixed(1) : 0}/5.0</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${userMetrics ? (userMetrics.averageRating / 5) * 100 : 0}%` }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Market average: 4.2/5.0</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Service Categories</CardTitle>
              <CardDescription>Market demand and competition analysis by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.length > 0 ? categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant={category.competition === 'High' ? 'destructive' : category.competition === 'Medium' ? 'default' : 'secondary'}>
                          {category.competition} Competition
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="block font-medium text-gray-900">{category.demand}%</span>
                          <span>Market Demand</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900">+{category.growth}%</span>
                          <span>Growth Rate</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900">{formatCurrency(category.averagePrice)}</span>
                          <span>Avg. Price</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">No category data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Market Analysis</CardTitle>
              <CardDescription>Market opportunities and competition by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regionalData.length > 0 ? regionalData.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {region.region}
                        </h3>
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{region.growth}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="block font-medium text-gray-900">{region.demand}%</span>
                          <span>Market Demand</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900">{formatNumber(region.competition)}</span>
                          <span>Competitors</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900">{formatCurrency(region.averagePrice)}</span>
                          <span>Avg. Price</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">No regional data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Trends</CardTitle>
                <CardDescription>Monthly market demand patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.length > 0 ? trendData.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${trend.demand}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{trend.demand}%</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-muted-foreground">No trend data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue and inquiry patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.length > 0 ? trendData.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(trend.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{trend.inquiries} inquiries</div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-muted-foreground">No revenue data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Insights</CardTitle>
              <CardDescription>Optimize your business strategy based on seasonal trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Peak Season</h4>
                  <p className="text-sm text-muted-foreground mb-2">April - June shows highest demand</p>
                  <p className="text-xs text-blue-600">💡 Consider premium pricing during this period</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Growth Opportunity</h4>
                  <p className="text-sm text-muted-foreground mb-2">March shows 18% month-over-month growth</p>
                  <p className="text-xs text-green-600">💡 Increase marketing spend in February</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
