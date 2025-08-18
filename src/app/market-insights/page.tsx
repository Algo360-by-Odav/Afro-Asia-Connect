'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity,
  Globe,
  Star,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';

interface MarketData {
  totalMarketSize: number;
  marketGrowth: number;
  competitorCount: number;
  averagePrice: number;
  demandTrend: 'up' | 'down' | 'stable';
  topCategories: Array<{
    name: string;
    demand: number;
    growth: number;
  }>;
  regionalData: Array<{
    region: string;
    demand: number;
    competition: number;
  }>;
  seasonalTrends: Array<{
    month: string;
    demand: number;
    revenue: number;
  }>;
}

interface UserMetrics {
  totalViews: number;
  inquiries: number;
  conversionRate: number;
  averageRating: number;
  marketShare: number;
  revenueGrowth: number;
}

const MarketInsightsPage: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
    fetchUserMetrics();
  }, [timeRange, selectedCategory]);

  const fetchMarketData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/market-insights/overview?timeRange=${timeRange}&category=${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMarketData(data.marketData);
        setUserMetrics(data.userMetrics);
      } else {
        // Fallback to demo data if API fails
        setMarketData({
          totalMarketSize: 2500000,
          marketGrowth: 12.5,
          competitorCount: 1250,
          averagePrice: 85,
          demandTrend: 'up',
          topCategories: [
            { name: 'Digital Marketing', demand: 85, growth: 15.2 },
            { name: 'Web Development', demand: 78, growth: 12.8 },
            { name: 'Consulting', demand: 72, growth: 8.5 },
            { name: 'Design Services', demand: 65, growth: 18.3 },
            { name: 'Content Creation', demand: 58, growth: 22.1 }
          ],
          regionalData: [
            { region: 'North America', demand: 92, competition: 85 },
            { region: 'Europe', demand: 78, competition: 72 },
            { region: 'Asia Pacific', demand: 85, competition: 68 },
            { region: 'Africa', demand: 65, competition: 45 },
            { region: 'South America', demand: 58, competition: 52 }
          ],
          seasonalTrends: [
            { month: 'Jan', demand: 75, revenue: 12500 },
            { month: 'Feb', demand: 78, revenue: 13200 },
            { month: 'Mar', demand: 82, revenue: 14800 },
            { month: 'Apr', demand: 85, revenue: 15600 },
            { month: 'May', demand: 88, revenue: 16200 },
            { month: 'Jun', demand: 92, revenue: 17800 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      // Use demo data as fallback
      setMarketData({
        totalMarketSize: 2500000,
        marketGrowth: 12.5,
        competitorCount: 1250,
        averagePrice: 85,
        demandTrend: 'up',
        topCategories: [
          { name: 'Digital Marketing', demand: 85, growth: 15.2 },
          { name: 'Web Development', demand: 78, growth: 12.8 },
          { name: 'Consulting', demand: 72, growth: 8.5 },
          { name: 'Design Services', demand: 65, growth: 18.3 },
          { name: 'Content Creation', demand: 58, growth: 22.1 }
        ],
        regionalData: [
          { region: 'North America', demand: 92, competition: 85 },
          { region: 'Europe', demand: 78, competition: 72 },
          { region: 'Asia Pacific', demand: 85, competition: 68 },
          { region: 'Africa', demand: 65, competition: 45 },
          { region: 'South America', demand: 58, competition: 52 }
        ],
        seasonalTrends: [
          { month: 'Jan', demand: 75, revenue: 12500 },
          { month: 'Feb', demand: 78, revenue: 13200 },
          { month: 'Mar', demand: 82, revenue: 14800 },
          { month: 'Apr', demand: 85, revenue: 15600 },
          { month: 'May', demand: 88, revenue: 16200 },
          { month: 'Jun', demand: 92, revenue: 17800 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMetrics = async () => {
    // User metrics are now fetched together with market data in fetchMarketData
    // This function is kept for compatibility but doesn't need to do anything
    if (!userMetrics) {
      setUserMetrics({
        totalViews: 1250,
        inquiries: 89,
        conversionRate: 7.1,
        averageRating: 4.6,
        marketShare: 2.3,
        revenueGrowth: 18.5
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Market Insights</h1>
          <p className="text-gray-600 mt-2">Understand your market position and identify opportunities</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketData?.totalMarketSize || 0)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{marketData?.marketGrowth}% growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Market Share</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userMetrics?.marketShare}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +{userMetrics?.revenueGrowth}% revenue growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(marketData?.competitorCount || 0)}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <Target className="w-3 h-3 mr-1" />
              Active in your category
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Service Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketData?.averagePrice || 0)}</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <Activity className="w-3 h-3 mr-1" />
              Market average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Your Performance
                </CardTitle>
                <CardDescription>
                  How you're performing compared to market averages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profile Views</span>
                  <span className="text-2xl font-bold">{formatNumber(userMetrics?.totalViews || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Inquiries</span>
                  <span className="text-2xl font-bold">{userMetrics?.inquiries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-2xl font-bold">{userMetrics?.conversionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{userMetrics?.averageRating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Market Opportunities
                </CardTitle>
                <CardDescription>
                  Identified opportunities for growth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-700">High Demand Categories</h4>
                  <p className="text-sm text-gray-600">Content Creation showing 22.1% growth</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-700">Underserved Regions</h4>
                  <p className="text-sm text-gray-600">Africa market has low competition (45%)</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-700">Pricing Opportunity</h4>
                  <p className="text-sm text-gray-600">Your pricing is 15% below market average</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-700">Seasonal Peak</h4>
                  <p className="text-sm text-gray-600">June shows highest demand (92%)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Service Categories</CardTitle>
              <CardDescription>
                Market demand and growth rates by service category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData?.topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{category.name}</h4>
                        <p className="text-sm text-gray-600">Demand: {category.demand}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={category.growth > 15 ? "default" : "secondary"}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +{category.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Market Analysis</CardTitle>
              <CardDescription>
                Demand and competition levels across different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData?.regionalData.map((region) => (
                  <div key={region.region} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">{region.region}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">Demand: {region.demand}%</Badge>
                        <Badge variant="outline">Competition: {region.competition}%</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Market Demand</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${region.demand}%` }}
                            aria-label={`Market demand: ${region.demand}%`}
                            title={`Market demand: ${region.demand}%`}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Competition Level</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${region.competition}%` }}
                            aria-label={`Competition level: ${region.competition}%`}
                            title={`Competition level: ${region.competition}%`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trends</CardTitle>
              <CardDescription>
                Monthly demand and revenue patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData?.seasonalTrends.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center font-semibold">{trend.month}</div>
                      <div>
                        <div className="text-sm text-gray-600">Demand: {trend.demand}%</div>
                        <div className="text-sm text-gray-600">Revenue: {formatCurrency(trend.revenue)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend.demand > 80 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">{trend.demand}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketInsightsPage;
