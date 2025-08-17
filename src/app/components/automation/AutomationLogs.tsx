'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  MessageSquare,
  Users,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AutomationLog {
  id: number;
  workflowId: number;
  workflowName?: string;
  triggerType: string;
  actionType: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  executionTime: number;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
}

export const AutomationLogs: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLogs(1, true);
  }, [statusFilter, workflowFilter]);

  const fetchLogs = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(workflowFilter !== 'all' && { workflowId: workflowFilter }),
      });

      const response = await fetch(`/api/automation/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newLogs = data.logs || [];
        
        if (reset) {
          setLogs(newLogs);
        } else {
          setLogs(prev => [...prev, ...newLogs]);
        }
        
        setHasMore(newLogs.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch automation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLogs(page + 1, false);
    }
  };

  const refresh = () => {
    fetchLogs(1, true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'SKIPPED':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'SKIPPED':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'keyword_detected':
        return <Search className="w-4 h-4 text-purple-600" />;
      case 'sentiment_negative':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'user_inactive':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'business_hours':
        return <Clock className="w-4 h-4 text-green-600" />;
      default:
        return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_auto_response':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'create_lead':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'assign_to_agent':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'schedule_follow_up':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'send_notification':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.triggerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.workflowName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Activity Logs</h2>
          <p className="text-gray-600">Monitor automation workflow executions</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="SKIPPED">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {/* Add workflow options dynamically */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Execution Logs
          </CardTitle>
          <CardDescription>
            Detailed log of all automation workflow executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || workflowFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Logs will appear here once your workflows start running'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(log.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {log.workflowName || `Workflow ${log.workflowId}`}
                            </h4>
                            {getStatusBadge(log.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              {getTriggerIcon(log.triggerType)}
                              <span className="capitalize">
                                {log.triggerType.replace('_', ' ')}
                              </span>
                            </div>
                            <span>→</span>
                            <div className="flex items-center gap-1">
                              {getActionIcon(log.actionType)}
                              <span className="capitalize">
                                {log.actionType.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <span>
                              {log.executionTime}ms
                            </span>
                          </div>

                          {log.errorMessage && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <div className="flex items-center gap-1 mb-1">
                                <XCircle className="w-3 h-3" />
                                <span className="font-medium">Error:</span>
                              </div>
                              <p>{log.errorMessage}</p>
                            </div>
                          )}

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                              <div className="font-medium text-gray-700 mb-1">Metadata:</div>
                              <pre className="text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
