'use client';

import React, { useState, useEffect } from 'react';
import { notificationService } from '@/utils/notifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState({
    newMessages: true,
    userOnline: false,
    soundEnabled: true,
  });

  useEffect(() => {
    setPermission(notificationService.getPermission());
    
    // Load settings from localStorage
    const saved = localStorage.getItem('chat-notification-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  const handlePermissionRequest = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('chat-notification-settings', JSON.stringify(newSettings));
  };

  const testNotification = () => {
    notificationService.showNotification('Test Notification', {
      body: 'This is a test notification from AfroAsiaConnect chat!',
      requireInteraction: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Permission Status */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Browser Notifications</h4>
                <p className="text-sm text-gray-500">
                  Status: {permission === 'granted' ? '✅ Enabled' : 
                           permission === 'denied' ? '❌ Blocked' : '⚠️ Not requested'}
                </p>
              </div>
              {permission !== 'granted' && (
                <button
                  onClick={handlePermissionRequest}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm"
                >
                  Enable
                </button>
              )}
            </div>
            
            {permission === 'granted' && (
              <button
                onClick={testNotification}
                className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Test Notification
              </button>
            )}
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Notification Types</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-sm text-gray-700">New Messages</label>
                <p className="text-xs text-gray-500">Get notified when you receive new messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.newMessages}
                  onChange={(e) => handleSettingChange('newMessages', e.target.checked)}
                  className="sr-only peer"
                  disabled={permission !== 'granted'}
                  aria-label="Enable new message notifications"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-sm text-gray-700">User Online</label>
                <p className="text-xs text-gray-500">Get notified when contacts come online</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.userOnline}
                  onChange={(e) => handleSettingChange('userOnline', e.target.checked)}
                  className="sr-only peer"
                  disabled={permission !== 'granted'}
                  aria-label="Enable user online notifications"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-sm text-gray-700">Sound Alerts</label>
                <p className="text-xs text-gray-500">Play sound with notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                  aria-label="Enable sound alerts"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
              </label>
            </div>
          </div>

          {permission === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Notifications Blocked
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      To enable notifications, please allow them in your browser settings and refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
