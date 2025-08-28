'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import PaymentForm from '@/app/components/payments/PaymentForm';
import PaymentSuccess from '@/app/components/payments/PaymentSuccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Booking {
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
  status: string;
  paymentStatus: string;
}

function PaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const serviceId = params?.id;
  const bookingId = searchParams?.get('bookingId');
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setBooking(data.booking);
          
          // Check if payment is already completed
          if (data.booking.paymentStatus === 'COMPLETED') {
            // Redirect to success or show already paid message
            setError('This booking has already been paid for');
          }
        } else {
          setError(data.message || 'Failed to load booking');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment successful:', result);
    setPaymentResult(result);
    
    // Update booking state
    if (booking) {
      setBooking({
        ...booking,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED'
      });
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading booking details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="flex space-x-2">
                <Link href={`/services/${serviceId}`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Service
                  </Button>
                </Link>
                
                <Link href="/dashboard/bookings">
                  <Button size="sm">
                    View My Bookings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <Alert>
                <AlertDescription>Booking not found</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success page if payment completed
  if (paymentResult && paymentResult.payment) {
    return (
      <PaymentSuccess 
        booking={booking}
        payment={paymentResult.payment}
      />
    );
  }

  // Show payment form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-lg text-gray-600">
            Secure your booking with a quick and safe payment
          </p>
        </div>

        {/* Back Navigation */}
        <div className="mb-6">
          <Link href={`/services/${serviceId}/book`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Booking
            </Button>
          </Link>
        </div>

        {/* Payment Form */}
        <div className="flex justify-center">
          <PaymentForm
            booking={booking}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            🔒 Your payment is secured with 256-bit SSL encryption
          </p>
          <p className="text-xs text-gray-500 mt-1">
            We never store your card details on our servers
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPageClient() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
