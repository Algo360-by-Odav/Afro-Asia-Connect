'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Star, RefreshCw, Users, Reply, Flag, ThumbsUp, Mail, TrendingUp, Target, Lightbulb, AlertCircle, CheckCircle2, ArrowUp } from 'lucide-react';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  service: string;
  helpful: number;
  sentiment: 'positive'|'neutral'|'negative';
  response?: { text: string; date: string; author: string };
  verified: boolean;
}

export default function ReviewsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  // simple filters
  const [ratingFilter, setRatingFilter] = useState('all');
  const [responseText, setResponseText] = useState('');
  const [respondingToReview, setRespondingToReview] = useState<number | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // redirect unauthenticated users after auth context resolves
  useEffect(() => {
    if (!isLoading && (!user || user.user_type !== 'service_provider')) {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  /* ------------------------- data fetch helpers ------------------------ */
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const api = (path: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${path}`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json());

  const refreshData = async () => {
    setLoading(true);
    try {
      const [ov, rev, an] = await Promise.all([
        api('overview'),
        api('reviews'),
        api('analytics')
      ]);
      setOverview(ov.overview);
      setReviews(rev.reviews);
      setAnalytics(an.analytics);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ refreshData(); },[]);

  const renderStars = (n:number)=>(
    <div className="flex">
      {Array.from({length:5},(_,i)=>(
        <Star key={i} className={`w-4 h-4 ${i<n?'fill-yellow-400 text-yellow-400':'text-gray-300'}`} />
      ))}
    </div>
  );

  const sentimentColor = (s:string)=> s==='positive'? 'bg-green-50 text-green-600': s==='negative'? 'bg-red-50 text-red-600':'bg-yellow-50 text-yellow-600';

  const handleSubmitResponse = async (reviewId: number) => {
    if (!responseText.trim()) return;
    
    setSubmittingResponse(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseText })
      });
      
      if (response.ok) {
        // Update the review in local state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, response: { text: responseText, date: new Date().toISOString(), author: 'You' } }
            : review
        ));
        setResponseText('');
        setRespondingToReview(null);
        alert('Response submitted successfully!');
      } else {
        alert('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response');
    }
    setSubmittingResponse(false);
  };

  // Insights tab handlers
  const handleSetResponseGoal = () => {
    alert('Response time goal feature coming soon!');
  };

  const handleSendReviewRequests = () => {
    alert('Review request email campaign feature coming soon!');
  };

  const handleViewCompetitorAnalysis = () => {
    alert('Competitor analysis dashboard coming soon!');
  };

  const handleRespondToPending = () => {
    alert('Redirecting to pending reviews...');
  };

  const handleImproveResponseRate = () => {
    alert('Response rate improvement tips coming soon!');
  };

  /* ------------------------------- render ------------------------------ */
  return (
    <div className="p-6 space-y-6">
      {isLoading ? (
        <div className="p-6 text-center w-full">Loading...</div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Reviews & Reputation</h1>
            <Button onClick={refreshData} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading?'animate-spin':''}`} />Refresh
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* --------------------------- Overview -------------------------- */}
            <TabsContent value="overview">
              {!overview? <p>Loading...</p> : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Total Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold text-blue-900">{overview.totalReviews}</p>
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">+{overview.recentReviews} this month</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-700">Average Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl font-bold text-yellow-900">{overview.averageRating}</p>
                          <div className="flex">{renderStars(Math.round(overview.averageRating))}</div>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">Based on {overview.totalReviews} reviews</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Response Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-green-900">{overview.responseRate}%</p>
                          <Progress value={overview.responseRate} className="h-2" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {overview.responseRate >= 90 ? 'Excellent!' : overview.responseRate >= 70 ? 'Good' : 'Needs improvement'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Avg Response Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold text-purple-900">{overview.averageResponseTime}h</p>
                          <RefreshCw className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          {overview.averageResponseTime <= 2 ? 'Very fast' : overview.averageResponseTime <= 6 ? 'Fast' : 'Could be faster'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Monthly Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {overview.monthlyStats?.map((month: any, index: number) => (
                            <div key={month.month} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                              <span className="text-sm font-medium">{month.month}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">{month.reviews} reviews</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium">{month.rating}</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                </div>
                              </div>
                            </div>
                          )) || <p className="text-sm text-gray-500">No monthly data available</p>}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Top Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {overview.topKeywords?.map((keyword: any, index: number) => (
                            <div key={keyword.word} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                              <span className="text-sm font-medium capitalize">{keyword.word}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{keyword.count}</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    keyword.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                    keyword.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {keyword.sentiment}
                                </Badge>
                              </div>
                            </div>
                          )) || <p className="text-sm text-gray-500">No keyword data available</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---------------------------- Reviews -------------------------- */}
            <TabsContent value="reviews" className="space-y-4">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {[5,4,3,2,1].map(r=>(<SelectItem key={r} value={String(r)}>{r} stars</SelectItem>))}
                </SelectContent>
              </Select>

              {reviews.filter(r=>ratingFilter==='all'||r.rating===Number(ratingFilter)).map(r=>(
                <Card key={r.id}>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><Users className="w-4 h-4"/></div>
                        <div>
                          <p className="font-medium flex items-center gap-2">{r.customerName}{r.verified&&<Badge variant="secondary" className="text-xs">Verified</Badge>}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">{renderStars(r.rating)}<span>•</span><span>{new Date(r.date).toLocaleDateString()}</span></div>
                        </div>
                      </div>
                      <Badge className={sentimentColor(r.sentiment)}>{r.sentiment}</Badge>
                    </div>
                    <h4 className="font-medium">{r.title}</h4>
                    <p className="text-muted-foreground">{r.comment}</p>
                    <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" />{r.helpful} helpful</div>
                      <div className="flex gap-2">
                        {!r.response && <Dialog open={respondingToReview === r.id} onOpenChange={(open) => {
                          if (!open) {
                            setRespondingToReview(null);
                            setResponseText('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setRespondingToReview(r.id)}
                            >
                              <Reply className="w-4 h-4 mr-1"/>Respond
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Respond to Review by {r.customerName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium">{r.title}</p>
                                <p className="text-sm text-gray-600">{r.comment}</p>
                              </div>
                              <Textarea 
                                placeholder="Write your response..." 
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setRespondingToReview(null);
                                    setResponseText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleSubmitResponse(r.id)}
                                  disabled={!responseText.trim() || submittingResponse}
                                >
                                  {submittingResponse ? 'Submitting...' : 'Submit Response'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>}
                        <Button size="sm" variant="ghost"><Flag className="w-4 h-4"/></Button>
                      </div>
                    </div>
                    {r.response && (<div className="p-4 bg-blue-50 rounded-md"><p className="text-sm"><span className="font-medium">Response:</span> {r.response.text}</p></div>)}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* --------------------------- Analytics ------------------------- */}
            <TabsContent value="analytics">
              {!analytics? <p>Loading...</p> : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Reputation Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-blue-600">{analytics.reputationScore}/100</p>
                          <Progress value={analytics.reputationScore} className="mt-2" />
                          <p className="text-sm text-muted-foreground mt-2">
                            {analytics.reputationScore >= 90 ? 'Excellent' : 
                             analytics.reputationScore >= 80 ? 'Very Good' :
                             analytics.reputationScore >= 70 ? 'Good' : 'Needs Improvement'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Response Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Response Rate</span>
                            <span className="font-medium">{overview?.responseRate}%</span>
                          </div>
                          <Progress value={overview?.responseRate || 0} />
                          <div className="flex justify-between">
                            <span className="text-sm">Avg Response Time</span>
                            <span className="font-medium">{overview?.averageResponseTime}h</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Sentiment Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-600">Positive</span>
                            <span className="font-medium">{analytics.sentimentBreakdown?.positive || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-yellow-600">Neutral</span>
                            <span className="font-medium">{analytics.sentimentBreakdown?.neutral || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-red-600">Negative</span>
                            <span className="font-medium">{analytics.sentimentBreakdown?.negative || 0}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Rating Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = overview?.ratingDistribution?.[rating] || 0;
                            const percentage = overview?.totalReviews ? (count / overview.totalReviews * 100) : 0;
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                  <span className="text-sm">{rating}</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                  <Progress value={percentage} className="h-2" />
                                </div>
                                <span className="text-sm text-muted-foreground w-12">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Key Performance Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium">Customer Satisfaction</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {analytics.customerSatisfaction || 92}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ArrowUp className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium">Review Growth</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">
                              +{analytics.reviewGrowth || 15}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium">Engagement Rate</span>
                            </div>
                            <span className="text-lg font-bold text-purple-600">
                              {analytics.engagementRate || 78}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* --------------------------- Insights -------------------------- */}
            <TabsContent value="insights">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">AI Recommendations</h2>
                <Card>
                  <CardHeader><CardTitle>Improve Response Time</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Respond to reviews within 24 hours to increase customer satisfaction.</p>
                    <Button onClick={handleSetResponseGoal} className="mt-4">Set up response time goal</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Enhance Review Quality</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Encourage customers to leave detailed reviews to increase review quality.</p>
                    <Button onClick={handleSendReviewRequests} className="mt-4">Send review request emails</Button>
                  </CardContent>
                </Card>
                <h2 className="text-2xl font-bold">Competitor Insights</h2>
                <Card>
                  <CardHeader><CardTitle>Competitor Review Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Analyze competitor reviews to identify areas for improvement.</p>
                    <Button onClick={handleViewCompetitorAnalysis} className="mt-4">View competitor review analysis</Button>
                  </CardContent>
                </Card>
                <h2 className="text-2xl font-bold">Action Items</h2>
                <Card>
                  <CardHeader><CardTitle>Respond to Pending Reviews</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Respond to pending reviews to increase customer satisfaction.</p>
                    <Button onClick={handleRespondToPending} className="mt-4">Respond to pending reviews</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Improve Review Response Rate</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Improve review response rate to increase customer satisfaction.</p>
                    <Button onClick={handleImproveResponseRate} className="mt-4">Improve review response rate</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
