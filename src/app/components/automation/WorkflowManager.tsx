'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Plus, X, MessageSquare, Users, Clock, Zap, Settings, AlertTriangle } from 'lucide-react';

interface TriggerType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  configFields: Array<{
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    options?: string[];
  }>;
}

interface ActionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  configFields: Array<{
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    options?: string[];
  }>;
}

interface Trigger {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

interface Action {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  triggers: Trigger[];
  actions: Action[];
  enabled?: boolean;
}

interface WorkflowManagerProps {
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
  workflow?: Workflow;
}

interface ActionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  configFields: Array<{
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    options?: string[];
  }>;
}



export const WorkflowManager: React.FC<WorkflowManagerProps> = ({ onClose, onSave, workflow }) => {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggers, setTriggers] = useState(workflow?.triggers || []);
  const [actions, setActions] = useState(workflow?.actions || []);
  const [triggerTypes, setTriggerTypes] = useState<TriggerType[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTriggerTypes();
    fetchActionTypes();
  }, []);

  const fetchTriggerTypes = async () => {
    // Use hardcoded data for testing without authentication
    setTriggerTypes([
      {
        id: 'message_received',
        name: 'Message Received',
        description: 'Trigger when a new message is received',
        icon: <MessageSquare className="w-4 h-4" />,
        configFields: []
      },
      {
        id: 'keyword_detected',
        name: 'Keyword Detected',
        description: 'Trigger when specific keywords are found in messages',
        icon: <Zap className="w-4 h-4" />,
        configFields: [
          {
            name: 'keywords',
            type: 'text',
            label: 'Keywords (comma-separated)',
            placeholder: 'price, quote, help'
          }
        ]
      },
      {
        id: 'sentiment_negative',
        name: 'Negative Sentiment',
        description: 'Trigger when negative sentiment is detected',
        icon: <AlertTriangle className="w-4 h-4" />,
        configFields: [
          {
            name: 'threshold',
            type: 'select',
            label: 'Sensitivity',
            options: ['low', 'medium', 'high']
          }
        ]
      },
      {
        id: 'user_inactive',
        name: 'User Inactive',
        description: 'Trigger when user has been inactive for a period',
        icon: <Clock className="w-4 h-4" />,
        configFields: [
          {
            name: 'minutes',
            type: 'number',
            label: 'Minutes of inactivity',
            placeholder: '30'
          }
        ]
      },
      {
        id: 'business_hours',
        name: 'Business Hours',
        description: 'Trigger based on business hours',
        icon: <Clock className="w-4 h-4" />,
        configFields: [
          {
            name: 'condition',
            type: 'select',
            label: 'Condition',
            options: ['outside_hours', 'within_hours']
          }
        ]
      }
    ]);
  };

  const fetchActionTypes = async () => {
    // Use hardcoded data for testing without authentication
    setActionTypes([
      {
        id: 'send_auto_response',
        name: 'Send Auto Response',
        description: 'Send an automated response message',
        icon: <MessageSquare className="w-4 h-4" />,
        configFields: [
          {
            name: 'template',
            type: 'select',
            label: 'Response Template',
            options: ['greeting', 'pricing', 'support', 'business_hours']
          },
          {
            name: 'customMessage',
            type: 'textarea',
            label: 'Custom Message (optional)',
            placeholder: 'Enter custom response...'
          }
        ]
      },
      {
        id: 'create_lead',
        name: 'Create Lead',
        description: 'Create a new lead in CRM',
        icon: <Users className="w-4 h-4" />,
        configFields: [
          {
            name: 'source',
            type: 'text',
            label: 'Lead Source',
            placeholder: 'Website Chat'
          },
          {
            name: 'score',
            type: 'number',
            label: 'Initial Score',
            placeholder: '50'
          }
        ]
      },
      {
        id: 'assign_to_agent',
        name: 'Assign to Agent',
        description: 'Assign conversation to an agent',
        icon: <Users className="w-4 h-4" />,
        configFields: [
          {
            name: 'agentId',
            type: 'select',
            label: 'Agent',
            options: ['auto', 'specific']
          }
        ]
      },
      {
        id: 'schedule_follow_up',
        name: 'Schedule Follow-up',
        description: 'Schedule a follow-up reminder',
        icon: <Clock className="w-4 h-4" />,
        configFields: [
          {
            name: 'delay',
            type: 'number',
            label: 'Delay (hours)',
            placeholder: '24'
          },
          {
            name: 'type',
            type: 'select',
            label: 'Follow-up Type',
            options: ['email', 'message', 'call']
          }
        ]
      },
      {
        id: 'send_notification',
        name: 'Send Notification',
        description: 'Send notification to team members',
        icon: <Zap className="w-4 h-4" />,
        configFields: [
          {
            name: 'message',
            type: 'text',
            label: 'Notification Message',
            placeholder: 'New high-priority lead detected'
          }
        ]
      }
    ]);
  };

  const addTrigger = (triggerTypeId: string) => {
    const triggerType = triggerTypes.find(t => t.id === triggerTypeId);
    if (triggerType) {
      const newTrigger = {
        id: Date.now().toString(),
        type: triggerTypeId,
        name: triggerType.name,
        config: {}
      };
      setTriggers([...triggers, newTrigger]);
    }
  };

  const addAction = (actionTypeId: string) => {
    const actionType = actionTypes.find(a => a.id === actionTypeId);
    if (actionType) {
      const newAction = {
        id: Date.now().toString(),
        type: actionTypeId,
        name: actionType.name,
        config: {}
      };
      setActions([...actions, newAction]);
    }
  };

  const removeTrigger = (triggerId: string) => {
    setTriggers(triggers.filter((t: Trigger) => t.id !== triggerId));
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter((a: Action) => a.id !== actionId));
  };

  const updateTriggerConfig = (triggerId: string, field: string, value: any) => {
    setTriggers(triggers.map((trigger: Trigger) => 
      trigger.id === triggerId 
        ? { ...trigger, config: { ...trigger.config, [field]: value } }
        : trigger
    ));
  };

  const updateActionConfig = (actionId: string, field: string, value: any) => {
    setActions(actions.map((action: Action) => 
      action.id === actionId 
        ? { ...action, config: { ...action.config, [field]: value } }
        : action
    ));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (triggers.length === 0) {
      alert('Please add at least one trigger');
      return;
    }

    if (actions.length === 0) {
      alert('Please add at least one action');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const method = workflow ? 'PUT' : 'POST';
      const url = workflow ? `/api/automation/workflows/${workflow.id}` : '/api/automation/workflows';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          triggers,
          actions,
          isActive: true
        }),
      });

      if (response.ok) {
        const savedWorkflow: Workflow = {
          id: workflow?.id,
          name,
          description,
          triggers,
          actions,
          enabled: true
        };
        onSave(savedWorkflow);
      } else {
        const error = await response.json();
        alert(`Failed to save workflow: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </DialogTitle>
          <DialogDescription>
            Set up triggers and actions to automate your messaging workflows
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lead Qualification Bot"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
              />
            </div>
          </div>

          {/* Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Triggers
              </CardTitle>
              <CardDescription>
                Define when this workflow should run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggers.map((trigger: Trigger) => {
                const triggerType = triggerTypes.find(t => t.id === trigger.type);
                return (
                  <div key={trigger.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {triggerType?.icon}
                        <span className="font-medium">{trigger.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrigger(trigger.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {triggerType?.configFields.map((field) => (
                      <div key={field.name} className="mb-3">
                        <Label>{field.label}</Label>
                        {field.type === 'select' ? (
                          <Select
                            value={trigger.config[field.name] || ''}
                            onValueChange={(value) => updateTriggerConfig(trigger.id, field.name, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            value={trigger.config[field.name] || ''}
                            onChange={(e) => updateTriggerConfig(trigger.id, field.name, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              <Select onValueChange={addTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((triggerType) => (
                    <SelectItem key={triggerType.id} value={triggerType.id}>
                      <div className="flex items-center gap-2">
                        {triggerType.icon}
                        <div>
                          <div className="font-medium">{triggerType.name}</div>
                          <div className="text-sm text-gray-500">{triggerType.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Actions
              </CardTitle>
              <CardDescription>
                Define what should happen when triggers are activated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.map((action: Action) => {
                const actionType = actionTypes.find(a => a.id === action.type);
                return (
                  <div key={action.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {actionType?.icon}
                        <span className="font-medium">{action.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAction(action.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {actionType?.configFields.map((field) => (
                      <div key={field.name} className="mb-3">
                        <Label>{field.label}</Label>
                        {field.type === 'select' ? (
                          <Select
                            value={action.config[field.name] || ''}
                            onValueChange={(value) => updateActionConfig(action.id, field.name, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            value={action.config[field.name] || ''}
                            onChange={(e) => updateActionConfig(action.id, field.name, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={action.config[field.name] || ''}
                            onChange={(e) => updateActionConfig(action.id, field.name, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              <Select onValueChange={addAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Add an action..." />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((actionType) => (
                    <SelectItem key={actionType.id} value={actionType.id}>
                      <div className="flex items-center gap-2">
                        {actionType.icon}
                        <div>
                          <div className="font-medium">{actionType.name}</div>
                          <div className="text-sm text-gray-500">{actionType.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Workflow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
