'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MessageTemplate {
  id: number;
  title: string;
  content: string;
  category: string;
  usageCount: number;
  createdAt: string;
}

interface MessageTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const categories = [
    { value: 'all', label: '📋 All Templates', emoji: '📋' },
    { value: 'greeting', label: '👋 Greetings', emoji: '👋' },
    { value: 'business', label: '💼 Business', emoji: '💼' },
    { value: 'scheduling', label: '📅 Scheduling', emoji: '📅' },
    { value: 'followup', label: '🔄 Follow-up', emoji: '🔄' },
    { value: 'closing', label: '✅ Closing', emoji: '✅' },
    { value: 'support', label: '🛠️ Support', emoji: '🛠️' },
    { value: 'negotiation', label: '🤝 Negotiation', emoji: '🤝' },
    { value: 'urgent', label: '🚨 Urgent', emoji: '🚨' },
    { value: 'general', label: '💬 General', emoji: '💬' }
  ];

  useEffect(() => {
    if (isOpen && user) {
      loadTemplates();
    }
  }, [isOpen, user, selectedCategory]);

  const loadTemplates = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const categoryParam = selectedCategory === 'all' ? '' : `&category=${selectedCategory}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/message-templates?userId=${user.id}${categoryParam}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        
        // If no templates exist, create default ones
        if (data.length === 0 && selectedCategory === 'all') {
          await createDefaultTemplates();
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-templates/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        loadTemplates(); // Reload templates
      }
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.title.trim() || !newTemplate.content.trim()) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          ...newTemplate
        })
      });
      
      if (response.ok) {
        setNewTemplate({ title: '', content: '', category: 'general' });
        setShowCreateForm(false);
        loadTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const useTemplate = async (template: MessageTemplate) => {
    if (!user) return;
    
    try {
      // Increment usage count
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });
      
      // Use the template
      onSelectTemplate(template.content);
      onClose();
    } catch (error) {
      console.error('Error using template:', error);
      // Still use the template even if tracking fails
      onSelectTemplate(template.content);
      onClose();
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    onSelectTemplate(template.content);
    onClose();
  };

  const deleteTemplate = async (templateId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">📝 Message Templates</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              ➕ New Template
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {selectedCategory === 'all' 
                  ? '📝 No templates found. Create your first template!' 
                  : `📝 No templates in ${categories.find(c => c.value === selectedCategory)?.label} category`
                }
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ Create Template
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-800">{template.title}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {categories.find(c => c.value === template.category)?.emoji} {template.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          Used {template.usageCount} times
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.content}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          ✅ Use Template
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Template Modal */}
        {showCreateForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">➕ Create New Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Professional Greeting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Template category"
                  >
                    {categories.filter(c => c.value !== 'all').map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your template message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  disabled={!newTemplate.title.trim() || !newTemplate.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageTemplates;
