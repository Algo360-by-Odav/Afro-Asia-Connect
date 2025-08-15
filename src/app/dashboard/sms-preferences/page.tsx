'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  MessageSquare, 
  Bell, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Save
} from 'lucide-react';

interface SMSPreferences {
  smsEnabled: boolean;
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  statusUpdates: boolean;
  paymentConfirmations: boolean;
  twoFactorAuth: boolean;
}

interface UserProfile {
  phone: string | null;
  smsPreferences: SMSPreferences;
}

export default function SMSPreferencesPage() {
  const [profile, setProfile] = useState<UserProfile>({
    phone: '',
    smsPreferences: {
      smsEnabled: true,
      bookingConfirmations: true,
      bookingReminders: true,
      statusUpdates: true,
      paymentConfirmations: true,
      twoFactorAuth: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchSMSPreferences();
  }, []);

  const fetchSMSPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          phone: data.phone || '',
          smsPreferences: data.smsPreferences || profile.smsPreferences
        });
        setPhoneVerified(!!data.phone);
      }
    } catch (error) {
      console.error('Error fetching SMS preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load SMS preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: profile.phone,
          smsPreferences: profile.smsPreferences
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'SMS preferences saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving SMS preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save SMS preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    if (!profile.phone) {
      setMessage({ type: 'error', text: 'Please enter a phone number first' });
      return;
    }

    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: profile.phone })
      });

      if (response.ok) {
        setVerificationSent(true);
        setMessage({ type: 'success', text: 'Verification code sent to your phone!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to send verification code' });
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setMessage({ type: 'error', text: 'Failed to send verification code' });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!verificationCode) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/verify-phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phone: profile.phone,
          code: verificationCode 
        })
      });

      if (response.ok) {
        setPhoneVerified(true);
        setVerificationSent(false);
        setVerificationCode('');
        setMessage({ type: 'success', text: 'Phone number verified successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Invalid verification code' });
      }
    } catch (error) {
      console.error('Error verifying phone:', error);
      setMessage({ type: 'error', text: 'Failed to verify phone number' });
    } finally {
      setVerifying(false);
    }
  };

  const handlePreferenceChange = (key: keyof SMSPreferences, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      smsPreferences: {
        ...prev.smsPreferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Preferences</h1>
        <p className="text-gray-600">
          Manage your SMS notification settings and phone number verification
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Phone Number Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number
            </CardTitle>
            <CardDescription>
              Verify your phone number to receive SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={phoneVerified}
                />
              </div>
              <div className="flex items-center gap-2">
                {phoneVerified ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>

            {!phoneVerified && (
              <div className="space-y-4">
                {!verificationSent ? (
                  <Button 
                    onClick={handleSendVerification}
                    disabled={verifying || !profile.phone}
                    className="w-full sm:w-auto"
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Send Verification Code
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyPhone}
                      disabled={verifying || !verificationCode}
                    >
                      {verifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Choose which notifications you'd like to receive via SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master SMS Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <Label htmlFor="sms-enabled" className="text-base font-medium">
                  Enable SMS Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Master switch for all SMS notifications
                </p>
              </div>
              <Switch
                checked={profile.smsPreferences.smsEnabled}
                onCheckedChange={(checked) => handlePreferenceChange('smsEnabled', checked)}
                disabled={!phoneVerified}
              />
            </div>

            <Separator />

            {/* Individual Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <Label htmlFor="booking-confirmations">Booking Confirmations</Label>
                    <p className="text-sm text-gray-600">Get notified when bookings are confirmed</p>
                  </div>
                </div>
                <Switch
                  checked={profile.smsPreferences.bookingConfirmations}
                  onCheckedChange={(checked) => handlePreferenceChange('bookingConfirmations', checked)}
                  disabled={!profile.smsPreferences.smsEnabled || !phoneVerified}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-orange-600" />
                  <div>
                    <Label htmlFor="booking-reminders">Booking Reminders</Label>
                    <p className="text-sm text-gray-600">Receive reminders before your appointments</p>
                  </div>
                </div>
                <Switch
                  checked={profile.smsPreferences.bookingReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('bookingReminders', checked)}
                  disabled={!profile.smsPreferences.smsEnabled || !phoneVerified}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  <div>
                    <Label htmlFor="status-updates">Status Updates</Label>
                    <p className="text-sm text-gray-600">Get notified when booking status changes</p>
                  </div>
                </div>
                <Switch
                  checked={profile.smsPreferences.statusUpdates}
                  onCheckedChange={(checked) => handlePreferenceChange('statusUpdates', checked)}
                  disabled={!profile.smsPreferences.smsEnabled || !phoneVerified}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <div>
                    <Label htmlFor="payment-confirmations">Payment Confirmations</Label>
                    <p className="text-sm text-gray-600">Receive payment confirmation messages</p>
                  </div>
                </div>
                <Switch
                  checked={profile.smsPreferences.paymentConfirmations}
                  onCheckedChange={(checked) => handlePreferenceChange('paymentConfirmations', checked)}
                  disabled={!profile.smsPreferences.smsEnabled || !phoneVerified}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-red-600" />
                  <div>
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Use SMS for account security verification</p>
                  </div>
                </div>
                <Switch
                  checked={profile.smsPreferences.twoFactorAuth}
                  onCheckedChange={(checked) => handlePreferenceChange('twoFactorAuth', checked)}
                  disabled={!profile.smsPreferences.smsEnabled || !phoneVerified}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSavePreferences}
            disabled={saving || !phoneVerified}
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
