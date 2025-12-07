'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, BarChart3, Table, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';
import { getDirection } from '@/lib/utils/rtl';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import { InsightsPanel } from './InsightsPanel';

// Dynamically import charts to avoid SSR issues
const DynamicLineChart = dynamic(() => Promise.resolve(LineChart), { ssr: false });
const DynamicBarChart = dynamic(() => Promise.resolve(BarChart), { ssr: false });
const DynamicResponsiveContainer = dynamic(() => Promise.resolve(ResponsiveContainer), { ssr: false });

interface Business {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  business_id: string;
}

interface TrackingAnalyticsProps {
  locale: string;
}

interface AnalyticsData {
  totalClicks?: number;
  byCountry?: Array<{ country: string; count: number }>;
  byCity?: Array<{ city: string; count: number }>;
  byDevice?: Array<{ device: string; count: number }>;
  branches?: Array<{
    branch_id: string;
    branch_name: string;
    clicks: number;
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  }>;
  cards?: Array<{
    card_id: string;
    card_label: string;
    clicks: number;
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  }>;
  links?: Array<{
    tracking_link_id: string;
    slug: string;
    clicks: number;
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  }>;
}

interface TimeSeriesData {
  date: string;
  clicks: number;
  formattedDate: string;
}

interface ReviewTimeSeriesData {
  date: string;
  total_reviews: number;
  average_rating: number;
  new_reviews: number;
  formattedDate: string;
}

interface ConversionEstimate {
  percentage: number;
  clicks: number;
  newReviews: number;
  message: string;
}

export function TrackingAnalytics({ locale }: TrackingAnalyticsProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [reviewTimeSeriesData, setReviewTimeSeriesData] = useState<ReviewTimeSeriesData[]>([]);
  const [conversionEstimate, setConversionEstimate] = useState<ConversionEstimate | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();
  const dir = getDirection(locale);

  // Filters
  const ALL_BRANCHES = 'all';

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(ALL_BRANCHES);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const [viewLevel, setViewLevel] = useState<'total' | 'by_branch' | 'by_card' | 'by_link'>('total');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchBranches(selectedBusinessId);
    } else {
      setBranches([]);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchAnalytics();
    }
  }, [selectedBusinessId, selectedBranchId, timeRange, viewLevel]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
      
      // Auto-select first business if available
      if (data && data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_LOAD_BUSINESSES'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, business_id')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedBusinessId) return;

    try {
      setDataLoading(true);
      
      const params = new URLSearchParams({
        business_id: selectedBusinessId,
        time_range: timeRange,
        view_level: viewLevel,
      });

      if (selectedBranchId && selectedBranchId !== ALL_BRANCHES) {
        params.append('branch_id', selectedBranchId);
      }

      const response = await fetch(`/api/tracking/analytics?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setAnalyticsData(result.data);
      setTimeSeriesData(result.timeSeries || []);
      setReviewTimeSeriesData(result.reviewTimeSeries || []);
      setConversionEstimate(result.conversionEstimate || null);
      setTotalEvents(result.totalEvents || 0);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_LOAD_ANALYTICS'),
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const exportData = () => {
    // Simple CSV export
    if (!analyticsData) return;

    let csv = '';
    
    if (viewLevel === 'by_branch' && analyticsData.branches) {
      csv = 'Branch, Clicks, Countries, Cities\n';
      analyticsData.branches.forEach((branch) => {
        csv += `"${branch.branch_name}",${branch.clicks},"${branch.countries.map(c => c.country).join(', ')}","${branch.cities.map(c => c.city).join(', ')}"\n`;
      });
    } else if (viewLevel === 'by_card' && analyticsData.cards) {
      csv = 'Card, Clicks, Countries, Cities\n';
      analyticsData.cards.forEach((card) => {
        csv += `"${card.card_label}",${card.clicks},"${card.countries.map(c => c.country).join(', ')}","${card.cities.map(c => c.city).join(', ')}"\n`;
      });
    } else if (viewLevel === 'by_link' && analyticsData.links) {
      csv = 'Link, Clicks, Countries, Cities\n';
      analyticsData.links.forEach((link) => {
        csv += `"/r/${link.slug}",${link.clicks},"${link.countries.map(c => c.country).join(', ')}","${link.cities.map(c => c.city).join(', ')}"\n`;
      });
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${viewLevel}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={dir}>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-full">
        <div className="mx-auto max-w-7xl w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {t('TRACKING_ANALYTICS_PAGE_TITLE').replace(' - VETAP', '')}
                </h1>
                <p className="text-muted-foreground">
                  {t('TRACKING_ANALYZE_EVENTS')}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('TRACKING_FILTERS')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('TRACKING_BUSINESS')} *
                  </label>
                  <Select
                    value={selectedBusinessId}
                    onValueChange={(value) => {
                      setSelectedBusinessId(value);
                      setSelectedBranchId(ALL_BRANCHES);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('TRACKING_SELECT_BUSINESS')} />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('TRACKING_BRANCH')}
                  </label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={setSelectedBranchId}
                    disabled={!selectedBusinessId || branches.length === 0}
                  >
                    <SelectTrigger>
                    <SelectValue placeholder={t('TRACKING_ALL')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_BRANCHES}>{t('TRACKING_ALL')}</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('TRACKING_TIME_RANGE')}
                  </label>
                  <Select
                    value={timeRange}
                    onValueChange={(value: any) => setTimeRange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">
                        {t('TRACKING_TODAY')}
                      </SelectItem>
                      <SelectItem value="7days">
                        {t('TRACKING_7_DAYS')}
                      </SelectItem>
                      <SelectItem value="30days">
                        {t('TRACKING_30_DAYS')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('TRACKING_VIEW_LEVEL')}
                  </label>
                  <Select
                    value={viewLevel}
                    onValueChange={(value: any) => setViewLevel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">
                        {t('TRACKING_TOTAL')}
                      </SelectItem>
                      <SelectItem value="by_branch">
                        {t('TRACKING_BY_BRANCH')}
                      </SelectItem>
                      <SelectItem value="by_card">
                        {t('TRACKING_BY_CARD')}
                      </SelectItem>
                      <SelectItem value="by_link">
                        {t('TRACKING_BY_LINK')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {analyticsData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('TRACKING_TOTAL_CLICKS')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEvents}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('TRACKING_COUNTRIES')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.byCountry?.length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('TRACKING_CITIES')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.byCity?.length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('TRACKING_DEVICES')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.byDevice?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insights Panel */}
          {selectedBusinessId && (
            <InsightsPanel
              businessId={selectedBusinessId}
              branchId={selectedBranchId === ALL_BRANCHES ? undefined : selectedBranchId}
              timeRange={timeRange}
            />
          )}

          {/* Charts */}
          {dataLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* Line Chart - Clicks Over Time */}
              {timeSeriesData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('TRACKING_CLICKS_OVER_TIME')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicResponsiveContainer width="100%" height={300}>
                      <DynamicLineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="formattedDate" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                          labelStyle={{
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '8px',
                          }}
                          itemStyle={{
                            color: 'hsl(var(--foreground))',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="clicks" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name={t('TRACKING_CLICKS')}
                        />
                      </DynamicLineChart>
                    </DynamicResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bar Chart - Comparison */}
              {viewLevel === 'by_branch' && analyticsData.branches && analyticsData.branches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {t('TRACKING_BRANCHES_COMPARISON')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicResponsiveContainer width="100%" height={300}>
                      <DynamicBarChart data={analyticsData.branches}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="branch_name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                          labelStyle={{
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '8px',
                          }}
                          itemStyle={{
                            color: 'hsl(var(--foreground))',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="clicks" 
                          fill="hsl(var(--primary))"
                          name={t('TRACKING_CLICKS')}
                        />
                      </DynamicBarChart>
                    </DynamicResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bar Chart - Cards Comparison */}
              {viewLevel === 'by_card' && analyticsData.cards && analyticsData.cards.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {t('TRACKING_CARDS_COMPARISON')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicResponsiveContainer width="100%" height={300}>
                      <DynamicBarChart data={analyticsData.cards}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="card_label" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                          labelStyle={{
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '8px',
                          }}
                          itemStyle={{
                            color: 'hsl(var(--foreground))',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="clicks" 
                          fill="hsl(var(--primary))"
                          name={t('TRACKING_CLICKS')}
                        />
                      </DynamicBarChart>
                    </DynamicResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bar Chart - Links Comparison */}
              {viewLevel === 'by_link' && analyticsData.links && analyticsData.links.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {t('TRACKING_LINKS_COMPARISON')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicResponsiveContainer width="100%" height={300}>
                      <DynamicBarChart data={analyticsData.links.map(link => ({ ...link, link_label: `/r/${link.slug}` }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="link_label" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                          labelStyle={{
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '8px',
                          }}
                          itemStyle={{
                            color: 'hsl(var(--foreground))',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="clicks" 
                          fill="hsl(var(--primary))"
                          name={t('TRACKING_CLICKS')}
                        />
                      </DynamicBarChart>
                    </DynamicResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      {t('TRACKING_DATA_DETAILS')}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={exportData}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('TRACKING_EXPORT')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-primary/10 dark:bg-primary/20 border-b-2 border-primary/30">
                          {viewLevel === 'by_branch' && (
                            <>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_BRANCH')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CITY')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_COUNTRIES')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CLICKS')}
                              </th>
                            </>
                          )}
                          {viewLevel === 'by_card' && (
                            <>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CARD')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CITY')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_COUNTRIES')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CLICKS')}
                              </th>
                            </>
                          )}
                          {viewLevel === 'by_link' && (
                            <>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_LINK')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CITY')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_COUNTRIES')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CLICKS')}
                              </th>
                            </>
                          )}
                          {viewLevel === 'total' && (
                            <>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CITY')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_COUNTRIES')}
                              </th>
                              <th className={`text-left p-3 font-semibold text-foreground ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {t('TRACKING_CLICKS')}
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {viewLevel === 'by_branch' && (
                          analyticsData.branches && analyticsData.branches.length > 0 ? (
                            analyticsData.branches.map((branch, idx) => (
                              <tr 
                                key={branch.branch_id} 
                                className={`border-b border-border/50 ${
                                  idx % 2 === 0 
                                    ? 'bg-background' 
                                    : 'bg-muted/30 dark:bg-muted/20'
                                } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                              >
                                <td className="p-3 font-medium text-foreground">{branch.branch_name}</td>
                                <td className="p-3 text-muted-foreground">
                                  {branch.cities.length > 0 
                                    ? branch.cities.slice(0, 3).map(c => c.city).join(', ') + (branch.cities.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {branch.countries.length > 0 
                                    ? branch.countries.slice(0, 3).map(c => c.country).join(', ') + (branch.countries.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 font-bold text-primary dark:text-primary">{branch.clicks}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                {t('TRACKING_NO_DATA')}
                              </td>
                            </tr>
                          )
                        )}
                        {viewLevel === 'by_card' && (
                          analyticsData.cards && analyticsData.cards.length > 0 ? (
                            analyticsData.cards.map((card, idx) => (
                              <tr 
                                key={card.card_id} 
                                className={`border-b border-border/50 ${
                                  idx % 2 === 0 
                                    ? 'bg-background' 
                                    : 'bg-muted/30 dark:bg-muted/20'
                                } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                              >
                                <td className="p-3 font-medium text-foreground">{card.card_label}</td>
                                <td className="p-3 text-muted-foreground">
                                  {card.cities.length > 0 
                                    ? card.cities.slice(0, 3).map(c => c.city).join(', ') + (card.cities.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {card.countries.length > 0 
                                    ? card.countries.slice(0, 3).map(c => c.country).join(', ') + (card.countries.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 font-bold text-primary dark:text-primary">{card.clicks}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                {t('TRACKING_NO_DATA')}
                              </td>
                            </tr>
                          )
                        )}
                        {viewLevel === 'by_link' && (
                          analyticsData.links && analyticsData.links.length > 0 ? (
                            analyticsData.links.map((link, idx) => (
                              <tr 
                                key={link.tracking_link_id} 
                                className={`border-b border-border/50 ${
                                  idx % 2 === 0 
                                    ? 'bg-background' 
                                    : 'bg-muted/30 dark:bg-muted/20'
                                } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                              >
                                <td className="p-3 font-medium font-mono text-sm text-foreground">/r/{link.slug}</td>
                                <td className="p-3 text-muted-foreground">
                                  {link.cities.length > 0 
                                    ? link.cities.slice(0, 3).map(c => c.city).join(', ') + (link.cities.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {link.countries.length > 0 
                                    ? link.countries.slice(0, 3).map(c => c.country).join(', ') + (link.countries.length > 3 ? '...' : '')
                                    : <span className="text-muted-foreground/60">-</span>}
                                </td>
                                <td className="p-3 font-bold text-primary dark:text-primary">{link.clicks}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                {t('TRACKING_NO_DATA')}
                              </td>
                            </tr>
                          )
                        )}
                        {viewLevel === 'total' && (
                          analyticsData.byCity && analyticsData.byCity.length > 0 ? (
                            analyticsData.byCity.map((item, idx) => {
                              const country = analyticsData.byCountry?.find(c => 
                                analyticsData.byCity?.some(cy => cy.city === item.city)
                              );
                              return (
                                <tr 
                                  key={idx} 
                                  className={`border-b border-border/50 ${
                                    idx % 2 === 0 
                                      ? 'bg-background' 
                                      : 'bg-muted/30 dark:bg-muted/20'
                                  } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                                >
                                  <td className="p-3 text-foreground">{item.city || <span className="text-muted-foreground/60">-</span>}</td>
                                  <td className="p-3 text-muted-foreground">{country?.country || <span className="text-muted-foreground/60">-</span>}</td>
                                  <td className="p-3 font-bold text-primary dark:text-primary">{item.count}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                {t('TRACKING_NO_DATA')}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t('TRACKING_SELECT_BUSINESS_FIRST')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

