'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { BarChart3, TrendingUp, Clock, Users, MessageSquare, Zap, Target, CheckCircle } from 'lucide-react';

interface AutomationAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  topTriggers: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  topActions: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  executionsByDay: Array<{
    date: string;
    executions: number;
    successes: number;
    failures: number;
  }>;
  leadsGenerated: number;
  responsesSent: number;
  followUpsScheduled: number;
  avgResponseTime: number;
}

export const AutomationAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AutomationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/automation/analytics?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
            <p className="text-gray-600">Analytics will appear here once your workflows start running</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = analytics.totalExecutions > 0 
    ? Math.round((analytics.successfulExecutions / analytics.totalExecutions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Automation Analytics</h2>
          <p className="text-gray-600">Track the performance of your automation workflows</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalExecutions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Execution Time</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.averageExecutionTime}ms</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Generated</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.leadsGenerated}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Auto Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.responsesSent.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              Automated responses sent to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Follow-ups Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.followUpsScheduled.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              Follow-up reminders created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {analytics.avgResponseTime}s
            </div>
            <p className="text-sm text-gray-600">
              Average time to respond to messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Performing Triggers
          </CardTitle>
          <CardDescription>
            Most frequently activated automation triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topTriggers.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No trigger data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.topTriggers.map((trigger, index) => (
                <div key={trigger.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {trigger.type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">{trigger.count} executions</p>
                    </div>
                  </div>
                  <Badge variant={trigger.successRate >= 90 ? "default" : trigger.successRate >= 70 ? "secondary" : "destructive"}>
                    {trigger.successRate}% success
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Top Performing Actions
          </CardTitle>
          <CardDescription>
            Most frequently executed automation actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topActions.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No action data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.topActions.map((action, index) => (
                <div key={action.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {action.type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">{action.count} executions</p>
                    </div>
                  </div>
                  <Badge variant={action.successRate >= 90 ? "default" : action.successRate >= 70 ? "secondary" : "destructive"}>
                    {action.successRate}% success
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Execution Timeline
          </CardTitle>
          <CardDescription>
            Daily automation execution trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.executionsByDay.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No execution data available</p>
          ) : (
            <div className="space-y-3">
              {analytics.executionsByDay.slice(-7).map((day) => {
                const successRate = day.executions > 0 ? Math.round((day.successes / day.executions) * 100) : 0;
                return (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {day.executions} executions
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-green-600">
                        {day.successes} success
                      </div>
                      <div className="text-sm text-red-600">
                        {day.failures} failed
                      </div>
                      <Badge variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}>
                        {successRate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
