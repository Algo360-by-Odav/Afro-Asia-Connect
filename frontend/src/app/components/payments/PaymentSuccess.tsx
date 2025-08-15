'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User, DollarSign, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface PaymentSuccessProps {
  booking: {
    id: number;
    service: {
      serviceName: string;
      provider: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
      };
    };
    totalAmount: number;
    bookingDate: string;
    bookingTime: string;
    duration: number;
    customerName: string;
    customerEmail: string;
    specialRequests?: string;
  };
  payment: {
    id: number;
    paymentMethod: string;
    paidAt: string;
  };
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ booking, payment }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Your booking has been confirmed and paid
          </p>
        </div>

        {/* Booking Confirmation Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">
              Booking Confirmed
            </CardTitle>
            <CardDescription>
              Booking ID: #{booking.id}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Service Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium">{booking.service.serviceName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">{booking.bookingTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{booking.duration} minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Service Provider</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    {booking.service.provider.firstName} {booking.service.provider.lastName}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {booking.service.provider.email}
                  </span>
                </div>
                
                {booking.service.provider.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      {booking.service.provider.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="font-semibold text-lg text-green-600">
                        ${booking.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{payment.paymentMethod}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Payment ID</p>
                    <p className="font-medium">#{payment.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Paid At</p>
                    <p className="font-medium">
                      {new Date(payment.paidAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Special Requests</h3>
                <p className="text-sm text-gray-700">{booking.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Confirmation Email Sent</p>
                  <p className="text-sm text-gray-600">
                    We've sent a confirmation email to {booking.customerEmail}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Provider Notified</p>
                  <p className="text-sm text-gray-600">
                    Your service provider has been notified and will prepare for your appointment
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Automatic Reminders</p>
                  <p className="text-sm text-gray-600">
                    You'll receive reminder emails 24 hours and 1 hour before your appointment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/bookings">
            <Button size="lg" className="w-full sm:w-auto">
              View My Bookings
            </Button>
          </Link>
          
          <Link href="/services">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Book Another Service
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@afroasiaconnect.com" className="text-blue-600 hover:underline">
              support@afroasiaconnect.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
