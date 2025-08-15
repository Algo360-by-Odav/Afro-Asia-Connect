'use client';

import { 
  ArrowLeft, 
  CheckCircle, 
  MapPin, 
  Star, 
  Globe, 
  Mail, 
  Linkedin, 
  Clock, 
  Phone, 
  Calendar, 
  Users, 
  Award, 
  Shield, 
  MessageCircle, 
  Heart, 
  Share2, 
  BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import MessageButton from '@/app/components/messaging/MessageButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

interface Review {
  id: string;
  text: string;
  rating: number;
  reviewer: {
    firstName: string;
    lastName: string;
  };
}

interface Product {
  id: string;
  title: string;
  description: string;
}

interface Company {
  id: string;
  name: string;
  location: string;
  description: string;
  verified: boolean;
  trustScore: number;
  yearFounded: number | null;
  website: string;
  whatsapp: string;
  linkedin: string;
  reviews: Review[];
  products: Product[];
  averageRating?: string | number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: Company;
}

export interface Service {
  id: string;
  serviceName: string;
  serviceCategory: string;
  description: string;
  price: number | null;
  isActive: boolean;
  user: User;
  createdAt: string;
  updatedAt: string;
}

type Props = { serviceId: string };

/* ---------------- helper presentation components ---------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-6 space-y-4">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  if (!value) return null;
  const isLink = value.startsWith('http');
  const content = isLink ? (
    <a
      href={value}
      className="hover:underline text-sky-600 dark:text-sky-400 break-all"
      target="_blank"
      rel="noreferrer"
    >
      {value.replace(/^https?:\/\//, '')}
    </a>
  ) : (
    value
  );
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-slate-500" />
      <span className="font-medium">{label}:</span>
      <span className="ml-1">{content}</span>
    </li>
  );
}

export default function ServiceDetailContent({ serviceId }: Props) {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);
        if (!response.ok) {
          setError('Service not found');
          return;
        }
        const serviceData: Service = await response.json();
        setService(serviceData);
      } catch (err: any) {
        setError('Failed to load service');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Loading service...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Service not found'}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const company = service.user?.company || {
    id: '',
    name: 'N/A',
    location: 'N/A',
    description: 'No description available',
    verified: false,
    trustScore: 0,
    yearFounded: null,
    website: '#',
    whatsapp: '#',
    linkedin: '#',
    reviews: [],
    products: [],
    averageRating: '0.0',
  } as Company;

  const displayRating = company.averageRating ||
    (company.reviews.length > 0 ? (
      (company.reviews.reduce((sum, r) => sum + r.rating, 0) / company.reviews.length).toFixed(1)
    ) : '0.0');

  const handleBookNow = () => {
    // Redirect to booking page
    window.location.href = `/services/${service.id}/book`;
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement favorite functionality
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service.serviceName,
        text: `Check out this service: ${service.serviceName}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/services" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFavorite}
              className={isFavorited ? 'text-red-500' : ''}
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 h-24 w-24 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{service.serviceName}</h1>
                      {company.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-gray-600 mb-3">{company.name}</p>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        {Array(5).fill(null).map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(displayRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-2 text-gray-600 font-medium">{displayRating} ({company.reviews.length} reviews)</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{company.location}</span>
                      </div>
                      <Badge variant="outline">{service.serviceCategory}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Service Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">{service.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Duration varies</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Professional service</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Award className="h-4 w-4" />
                    <span>Quality guaranteed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Company */}
            <Card>
              <CardHeader>
                <CardTitle>About {company.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">{company.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{displayRating}</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{company.reviews.length}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{company.yearFounded || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Founded</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{company.trustScore}%</div>
                    <div className="text-sm text-gray-600">Trust Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            {company.products?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                        <p className="text-gray-600 text-sm">{product.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {company.reviews?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center space-x-1 mb-2">
                          {Array(5).fill(null).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-2">"{review.text}"</p>
                        <div className="text-sm text-gray-500">— {review.reviewer.firstName} {review.reviewer.lastName}</div>
                      </div>
                    ))}
                    {company.reviews.length > 3 && (
                      <Button variant="outline" className="w-full">
                        View All {company.reviews.length} Reviews
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Booking & Contact */}
          <div className="space-y-6">
            {/* Pricing & Booking */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {service.price ? `$${service.price}` : 'Contact for pricing'}
                  </div>
                  <p className="text-gray-600">Starting price</p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleBookNow}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Now
                  </Button>
                  
                  <MessageButton 
                    targetUserId={Number(service.user.id)}
                    targetUserName={`${service.user.firstName} ${service.user.lastName}`}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 text-lg font-semibold border"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Message
                  </MessageButton>
                </div>
                
                <div className="border-t border-gray-200 my-4"></div>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>Secure booking & payment</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ContactRow icon={Mail} label="Email" value={service.user.email} />
                <ContactRow icon={Globe} label="Website" value={company.website} />
                <ContactRow icon={Linkedin} label="LinkedIn" value={company.linkedin} />
                <ContactRow icon={MapPin} label="Location" value={company.location} />
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Verified provider</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Highly rated service</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Secure & reliable</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Quality guaranteed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
