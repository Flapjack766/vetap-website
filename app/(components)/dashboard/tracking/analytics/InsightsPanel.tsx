'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lightbulb, AlertTriangle, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { getDirection } from '@/lib/utils/rtl';

interface Insight {
  type: 'warning' | 'info' | 'success' | 'suggestion';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

interface InsightsPanelProps {
  businessId: string;
  branchId?: string;
  timeRange: 'today' | '7days' | '30days';
}

export function InsightsPanel({ businessId, branchId, timeRange }: InsightsPanelProps) {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const dir = getDirection(locale);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchInsights();
  }, [businessId, branchId, timeRange]);

  const fetchInsights = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        business_id: businessId,
        time_range: timeRange,
      });

      if (branchId) {
        params.append('branch_id', branchId);
      }

      const response = await fetch(`/api/tracking/insights?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch insights');
      }

      setInsights(result.insights || []);
      setSummary(result.summary || null);
    } catch (error: any) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'success':
        return 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400';
      case 'suggestion':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'info':
        return 'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {isArabic ? 'الرؤى والتحليلات' : 'Insights & Analytics'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'تحليل ذكي للبيانات والتوصيات'
              : 'Intelligent data analysis and recommendations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {isArabic 
              ? 'لا توجد رؤى متاحة حالياً. استمر في جمع البيانات لرؤية التحليلات الذكية.'
              : 'No insights available yet. Keep collecting data to see intelligent analytics.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {isArabic ? 'الرؤى والتحليلات' : 'Insights & Analytics'}
        </CardTitle>
        <CardDescription>
          {isArabic 
            ? 'تحليل ذكي للبيانات والتوصيات'
            : 'Intelligent data analysis and recommendations'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`text-center p-3 rounded-lg bg-muted ${isArabic ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {isArabic ? 'النقرات' : 'Clicks'}
              </p>
              <p className="text-lg font-bold">{summary.totalClicks || 0}</p>
            </div>
            <div className={`text-center p-3 rounded-lg bg-muted ${isArabic ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {isArabic ? 'تقييمات جديدة' : 'New Reviews'}
              </p>
              <p className="text-lg font-bold">{summary.newReviews || 0}</p>
            </div>
            <div className={`text-center p-3 rounded-lg bg-muted ${isArabic ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {isArabic ? 'معدل التحويل' : 'Conversion'}
              </p>
              <p className="text-lg font-bold">{summary.conversionRate || 0}%</p>
            </div>
            <div className={`text-center p-3 rounded-lg bg-muted ${isArabic ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {isArabic ? 'متوسط التقييم' : 'Avg Rating'}
              </p>
              <p className="text-lg font-bold">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '-'}
                {summary.averageRating > 0 && <span className="text-yellow-500 ml-1">⭐</span>}
              </p>
            </div>
          </div>
        )}

        {/* Insights List */}
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Alert
              key={index}
              className={`${getInsightColor(insight.type)} ${isArabic ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <AlertTitle className="mb-1">
                    {insight.title}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {insight.message}
                  </AlertDescription>
                  {insight.data && (
                    <div className="mt-2 text-xs opacity-75">
                      {insight.type === 'suggestion' && insight.data.conversionRate !== undefined && (
                        <span>
                          {isArabic 
                            ? `النقرات: ${insight.data.clicks} | التقييمات الجديدة: ${insight.data.newReviews}`
                            : `Clicks: ${insight.data.clicks} | New Reviews: ${insight.data.newReviews}`}
                        </span>
                      )}
                      {insight.type === 'warning' && insight.data.decline && (
                        <span>
                          {isArabic 
                            ? `الانخفاض: ${insight.data.decline} نجوم`
                            : `Decline: ${insight.data.decline} stars`}
                        </span>
                      )}
                      {insight.type === 'success' && insight.data.improvement && (
                        <span>
                          {isArabic 
                            ? `التحسن: +${insight.data.improvement} نجوم`
                            : `Improvement: +${insight.data.improvement} stars`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {insight.priority === 'high' && (
                  <div className="flex-shrink-0">
                    <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                      {isArabic ? 'عالي' : 'High'}
                    </span>
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

