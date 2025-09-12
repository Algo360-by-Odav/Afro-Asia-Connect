'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  serviceName: string;
  serviceCategory: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface BookingData {
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requirements: string;
  duration: string;
}

export default function BookServiceClient() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Booking form data
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: serviceId,
    date: '',
    time: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    requirements: '',
    duration: '1'
  });

  // Available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Duration options
  const durationOptions = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '4', label: '4 hours' },
    { value: '8', label: 'Full day' }
  ];

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/${serviceId}`);
        if (!response.ok) {
          setError('Service not found');
          return;
        }
        const foundService: Service = await response.json();
        setService(foundService);
      } catch (err: any) {
        setError('Failed to load service');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  // Check availability when date changes
  useEffect(() => {
    if (bookingData.date) {
      checkAvailability();
    }
  }, [bookingData.date]);

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token if available
        },
        body: JSON.stringify({
          serviceId: parseInt(params?.id as string),
          customerId: 1, // TODO: Get from auth context
          date: bookingData.date,
          time: bookingData.time,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          specialRequirements: bookingData.requirements,
          totalPrice: service?.price || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const bookingConfirmation = await response.json();
       
      setBookingConfirmed(true);
      setCurrentStep(4); // Move to confirmation step
    } catch (error) {
      console.error('Booking submission failed:', error);
      alert('Booking failed. Please try again. ' + (error as any)?.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAvailability = async () => {
    if (!bookingData.date) return;
    
    setIsCheckingAvailability(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/availability/${params?.id}?date=${bookingData.date}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTimeSlots(data.availableSlots || []);
      } else {
        setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
      setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return bookingData.date !== '' && bookingData.time !== '';
      case 2:
        return bookingData.customerName !== '' && bookingData.customerEmail !== '';
      case 3:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (isStepValid(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate available dates (next 30 days, excluding weekends for demo)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for demo
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Service not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your appointment for <strong>{service.serviceName}</strong> has been successfully booked.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold mb-4">Booking Details:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Service:</strong> {service.serviceName}</div>
                <div><strong>Date:</strong> {new Date(bookingData.date).toLocaleDateString()}</div>
                <div><strong>Time:</strong> {bookingData.time}</div>
                <div><strong>Duration:</strong> {durationOptions.find(d => d.value === bookingData.duration)?.label}</div>
                <div><strong>Customer:</strong> {bookingData.customerName}</div>
                <div><strong>Email:</strong> {bookingData.customerEmail}</div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={() => router.push('/services')} variant="outline" className="flex-1">
                Browse More Services
              </Button>
              <Button onClick={() => router.push('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/services/${serviceId}`} className="inline-flex items-center text-blue-600 hover:underline mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Service
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Book {service.serviceName}</h1>
          <p className="text-gray-600 mt-2">Schedule your appointment in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className={`ml-2 text-sm font-medium ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Date & Time'}
                  {step === 2 && 'Your Details'}
                  {step === 3 && 'Review & Confirm'}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Date & Time */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Select Date & Time
                      </h3>
                      
                      {/* Date Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose Date
                        </label>
                        <Select value={bookingData.date} onValueChange={(value) => handleInputChange('date', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a date" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.map(date => (
                              <SelectItem key={date} value={date}>
                                {new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Time Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose Time
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {isCheckingAvailability ? (
                            <div className="col-span-3 text-center py-4 text-gray-500">
                              Loading available times...
                            </div>
                          ) : availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map(time => (
                              <button
                                key={time}
                                onClick={() => handleInputChange('time', time)}
                                className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                                  bookingData.time === time
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                }`}
                              >
                                {time}
                              </button>
                            ))
                          ) : (
                            <div className="col-span-3 text-center py-4 text-gray-500">
                              Please select a date to see available times
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Duration Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <Select value={bookingData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Customer Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Your Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <Input
                            value={bookingData.customerName}
                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            value={bookingData.customerEmail}
                            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                            placeholder="Enter your email"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <Input
                            type="tel"
                            value={bookingData.customerPhone}
                            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Requirements
                          </label>
                          <Textarea
                            value={bookingData.requirements}
                            onChange={(e) => handleInputChange('requirements', e.target.value)}
                            placeholder="Any specific requirements or notes..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Review & Confirm
                      </h3>
                      
                      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Service:</span>
                          <span>{service.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Date:</span>
                          <span>{new Date(bookingData.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Time:</span>
                          <span>{bookingData.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Duration:</span>
                          <span>{durationOptions.find(d => d.value === bookingData.duration)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Customer:</span>
                          <span>{bookingData.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{bookingData.customerEmail}</span>
                        </div>
                        {bookingData.customerPhone && (
                          <div className="flex justify-between">
                            <span className="font-medium">Phone:</span>
                            <span>{bookingData.customerPhone}</span>
                          </div>
                        )}
                        {bookingData.requirements && (
                          <div>
                            <span className="font-medium">Requirements:</span>
                            <p className="text-gray-600 mt-1">{bookingData.requirements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!isStepValid(currentStep)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{service.serviceName}</h4>
                    <Badge variant="outline">{service.serviceCategory}</Badge>
                  </div>
                  
                  {bookingData.date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(bookingData.date).toLocaleDateString()}
                    </div>
                  )}
                  
                  {bookingData.time && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {bookingData.time} ({durationOptions.find(d => d.value === bookingData.duration)?.label})
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${service.price * parseInt(bookingData.duration)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${service.price} × {bookingData.duration} hour(s)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
