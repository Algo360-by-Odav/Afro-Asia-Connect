'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { ArrowLeft, Search, Grid, List, Users, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CategoryData {
  name: string;
  count: number;
  averageRating: number;
  averagePrice: number;
  description: string;
  trending: boolean;
}

export default function ServiceCategoriesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services`);
        if (!response.ok) {
          setError('Failed to load services');
          return;
        }
        const data = await response.json();
        setServices(data);
        
        // Process categories
        const categoryMap = new Map<string, any[]>();
        data.forEach((service: any) => {
          const category = service.serviceCategory;
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(service);
        });

        const categoryData: CategoryData[] = Array.from(categoryMap.entries()).map(([name, services]) => {
          const avgRating = services.reduce((sum, s) => sum + (s.rating || 0), 0) / services.length;
          const avgPrice = services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length;
          
          return {
            name,
            count: services.length,
            averageRating: avgRating || 0,
            averagePrice: avgPrice || 0,
            description: getCategoryDescription(name),
            trending: services.length > 5 // Simple trending logic
          };
        });

        categoryData.sort((a, b) => b.count - a.count); // Sort by popularity
        setCategories(categoryData);
        setFilteredCategories(categoryData);
      } catch (err: any) {
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [categories, searchTerm]);

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      'Technology': 'Digital solutions, software development, and IT consulting services',
      'Marketing': 'Brand promotion, digital marketing, and advertising solutions',
      'Design': 'Creative design services including graphics, web, and product design',
      'Consulting': 'Professional advisory and strategic consulting services',
      'Education': 'Learning, training, and educational development services',
      'Health': 'Healthcare, wellness, and medical consultation services',
      'Finance': 'Financial planning, accounting, and investment advisory services',
      'Legal': 'Legal consultation, documentation, and compliance services',
      'Construction': 'Building, renovation, and construction management services',
      'Transportation': 'Logistics, delivery, and transportation solutions'
    };
    return descriptions[category] || 'Professional services in this category';
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/services" className="inline-flex items-center text-blue-600 hover:underline mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Service Categories</h1>
            <p className="text-gray-600 mt-2">Explore services by category</p>
          </div>
        </div>

        {/* Search and Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-gray-600">Total Services</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {categories.filter(c => c.trending).length}
              </div>
              <div className="text-sm text-gray-600">Trending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {(categories.reduce((sum, c) => sum + c.averageRating, 0) / categories.length || 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Showing {filteredCategories.length} of {categories.length} categories
          </p>
        </div>

        {/* Categories Grid/List */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredCategories.map((category) => (
            <Card
              key={category.name}
              className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => window.location.href = `/services?category=${encodeURIComponent(category.name)}`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {category.trending && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{category.count} services</span>
                    </div>
                    {category.averageRating > 0 && renderStars(category.averageRating)}
                  </div>
                  
                  {category.averagePrice > 0 && (
                    <div className="text-lg font-semibold text-blue-600">
                      Starting from ${category.averagePrice.toFixed(0)}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-200">
                    Explore {category.name} Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No categories found</h2>
            <p className="text-gray-600">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
