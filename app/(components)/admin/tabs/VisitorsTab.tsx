'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Users, 
  MapPin, 
  Globe, 
  Calendar, 
  Monitor, 
  Smartphone, 
  Tablet,
  Download,
  Eye,
  MousePointerClick,
  TrendingUp,
  Clock,
  User,
  UserCheck,
  UserX,
  Network,
  Activity,
  FileText,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';

interface VisitorsTabProps {
  locale: string;
}

interface Visitor {
  id: string; // session_id or IP
  session_id: string | null;
  ip_address: string | null;
  first_visit: string;
  last_visit: string;
  total_visits: number;
  total_events: number;
  total_conversions: number;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  // Account information
  has_account: boolean;
  account_count: number;
  user_ids: string[];
  profile_ids: string[];
  emails: string[];
  // Engagement metrics
  engagement_score: number;
  avg_session_duration: number;
  pages_per_session: number;
  bounce_rate: number;
}

interface VisitorDetails extends Visitor {
  sessions: any[];
  events: any[];
  conversions: any[];
  profiles: any[];
  user_journey: any[];
}

export function VisitorsTab({ locale }: VisitorsTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_account' | 'without_account'>('all');

  useEffect(() => {
    fetchVisitors();
  }, [timeRange]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use API route instead of direct database access
      const response = await fetch(`/api/admin/visitors?time_range=${timeRange}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch visitors');
      }

      const data = await response.json();
      setVisitors(data.visitors || []);
    } catch (err: any) {
      console.error('Error fetching visitors:', err);
      setError(err.message || 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorDetails = async (visitor: Visitor) => {
    try {
      setLoadingDetails(true);

      // Use API route instead of direct database access
      const params = new URLSearchParams();
      if (visitor.session_id) params.append('session_id', visitor.session_id);
      if (visitor.ip_address) params.append('ip_address', visitor.ip_address);

      const response = await fetch(`/api/admin/visitors/${visitor.id}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch visitor details');
      }

      const data = await response.json();

      const details: VisitorDetails = {
        ...visitor,
        sessions: data.sessions || [],
        events: data.events || [],
        conversions: data.conversions || [],
        profiles: data.profiles || [],
        user_journey: data.user_journey || [],
      };

      setSelectedVisitor(details);
      setDetailsOpen(true);
    } catch (err: any) {
      console.error('Error fetching visitor details:', err);
      setError(err.message || 'Failed to load visitor details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      
      const filteredVisitors = getFilteredVisitors();
      const data = filteredVisitors.map(v => ({
        id: v.id,
        session_id: v.session_id,
        ip_address: v.ip_address,
        first_visit: v.first_visit,
        last_visit: v.last_visit,
        total_visits: v.total_visits,
        total_events: v.total_events,
        total_conversions: v.total_conversions,
        country: v.country,
        city: v.city,
        device_type: v.device_type,
        browser: v.browser,
        os: v.os,
        referrer: v.referrer,
        has_account: v.has_account,
        account_count: v.account_count,
        engagement_score: v.engagement_score,
        avg_session_duration: v.avg_session_duration,
        pages_per_session: v.pages_per_session,
        bounce_rate: v.bounce_rate,
      }));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitors-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV
        const headers = Object.keys(data[0] || {});
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
            }).join(',')
          ),
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitors-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert(locale === 'ar' ? 'فشل التصدير' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getFilteredVisitors = () => {
    let filtered = visitors;

    // Filter by account status
    if (filterType === 'with_account') {
      filtered = filtered.filter(v => v.has_account);
    } else if (filterType === 'without_account') {
      filtered = filtered.filter(v => !v.has_account);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.ip_address?.toLowerCase().includes(query) ||
        v.country?.toLowerCase().includes(query) ||
        v.city?.toLowerCase().includes(query) ||
        v.session_id?.toLowerCase().includes(query) ||
        v.emails.some(e => e?.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(num);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
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

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">{error}</div>
          <Button onClick={fetchVisitors} className="mt-4 mx-auto block">
            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredVisitors = getFilteredVisitors();
  const stats = {
    total: visitors.length,
    with_account: visitors.filter(v => v.has_account).length,
    without_account: visitors.filter(v => !v.has_account).length,
    total_visits: visitors.reduce((sum, v) => sum + v.total_visits, 0),
    total_events: visitors.reduce((sum, v) => sum + v.total_events, 0),
    total_conversions: visitors.reduce((sum, v) => sum + v.total_conversions, 0),
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === 'ar' ? 'إجمالي الزوار' : 'Total Visitors'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'زائر فريد' : 'Unique visitors'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === 'ar' ? 'لديهم حساب' : 'With Account'}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.with_account)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? `${((stats.with_account / stats.total) * 100).toFixed(1)}% من الزوار` : `${((stats.with_account / stats.total) * 100).toFixed(1)}% of visitors`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_visits)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'زيارة' : 'Visits'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === 'ar' ? 'التحويلات' : 'Conversions'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_conversions)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'تحويل' : 'Conversion events'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{locale === 'ar' ? 'الزوار' : 'Visitors'}</CardTitle>
              <CardDescription>
                {locale === 'ar' ? 'عرض وإدارة جميع زوار الموقع' : 'View and manage all website visitors'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="7d">{locale === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</option>
                <option value="30d">{locale === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}</option>
                <option value="90d">{locale === 'ar' ? 'آخر 90 يوم' : 'Last 90 days'}</option>
                <option value="all">{locale === 'ar' ? 'الكل' : 'All time'}</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">{locale === 'ar' ? 'الكل' : 'All'}</option>
                <option value="with_account">{locale === 'ar' ? 'لديهم حساب' : 'With Account'}</option>
                <option value="without_account">{locale === 'ar' ? 'بدون حساب' : 'Without Account'}</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVisitors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {locale === 'ar' ? 'لا توجد زوار' : 'No visitors found'}
            </div>
          ) : (
            <div className="space-y-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'الزائر' : 'Visitor'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'الحساب' : 'Account'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'الزيارات' : 'Visits'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'الموقع' : 'Location'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'الجهاز' : 'Device'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'آخر زيارة' : 'Last Visit'}</th>
                    <th className="text-left p-3 font-medium text-sm">{locale === 'ar' ? 'التفاعل' : 'Engagement'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr
                      key={visitor.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => fetchVisitorDetails(visitor)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-mono">{visitor.ip_address || visitor.session_id?.substring(0, 20) || '-'}</p>
                            {visitor.session_id && (
                              <p className="text-xs text-muted-foreground">{visitor.session_id.substring(0, 15)}...</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {visitor.has_account ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm font-semibold text-green-600">
                                {locale === 'ar' ? `${visitor.account_count} حساب` : `${visitor.account_count} account${visitor.account_count > 1 ? 's' : ''}`}
                              </p>
                              {visitor.emails.length > 0 && (
                                <p className="text-xs text-muted-foreground">{visitor.emails[0]}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{locale === 'ar' ? 'بدون حساب' : 'No account'}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{formatNumber(visitor.total_visits)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(visitor.total_events)} {locale === 'ar' ? 'حدث' : 'events'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            {visitor.country ? (
                              <>
                                <p className="text-sm">{visitor.country}</p>
                                {visitor.city && (
                                  <p className="text-xs text-muted-foreground">{visitor.city}</p>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">{visitor.device_type || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {visitor.browser || '-'} • {visitor.os || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(visitor.last_visit)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{formatNumber(visitor.engagement_score)}</p>
                          <p className="text-xs text-muted-foreground">
                            {visitor.avg_session_duration > 0 && formatDuration(visitor.avg_session_duration)}
                            {visitor.bounce_rate > 0 && ` • ${visitor.bounce_rate.toFixed(1)}% bounce`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visitor Details Dialog */}
      {selectedVisitor && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                {locale === 'ar' ? 'تفاصيل الزائر' : 'Visitor Details'}
              </DialogTitle>
              <DialogDescription>
                {locale === 'ar' 
                  ? `معلومات شاملة عن الزائر: ${selectedVisitor.ip_address || selectedVisitor.session_id || 'Unknown'}`
                  : `Comprehensive information about visitor: ${selectedVisitor.ip_address || selectedVisitor.session_id || 'Unknown'}`}
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">{locale === 'ar' ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
                  <TabsTrigger value="sessions">{locale === 'ar' ? 'الجلسات' : 'Sessions'}</TabsTrigger>
                  <TabsTrigger value="events">{locale === 'ar' ? 'الأحداث' : 'Events'}</TabsTrigger>
                  <TabsTrigger value="journey">{locale === 'ar' ? 'المسار' : 'Journey'}</TabsTrigger>
                  {selectedVisitor.has_account && (
                    <TabsTrigger value="accounts">{locale === 'ar' ? 'الحسابات' : 'Accounts'}</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات أساسية' : 'Basic Information'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'عنوان IP' : 'IP Address'}</label>
                          <p className="font-mono">{selectedVisitor.ip_address || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'معرف الجلسة' : 'Session ID'}</label>
                          <p className="font-mono text-xs">{selectedVisitor.session_id || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'أول زيارة' : 'First Visit'}</label>
                          <p>{formatDate(selectedVisitor.first_visit)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'آخر زيارة' : 'Last Visit'}</label>
                          <p>{formatDate(selectedVisitor.last_visit)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}</label>
                          <p className="font-semibold">{formatNumber(selectedVisitor.total_visits)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات الحساب' : 'Account Information'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {selectedVisitor.has_account ? (
                          <>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-semibold text-green-600">
                                  {locale === 'ar' ? 'لديه حساب' : 'Has Account'}
                                </p>
                                <p className="text-muted-foreground">
                                  {locale === 'ar' 
                                    ? `${selectedVisitor.account_count} حساب مسجل`
                                    : `${selectedVisitor.account_count} registered account${selectedVisitor.account_count > 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>
                            {selectedVisitor.emails.length > 0 && (
                              <div>
                                <label className="text-muted-foreground">{locale === 'ar' ? 'الإيميلات' : 'Emails'}</label>
                                <div className="space-y-1">
                                  {selectedVisitor.emails.map((email, idx) => (
                                    <p key={idx} className="font-mono text-xs">{email}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="text-muted-foreground">{locale === 'ar' ? 'معرفات المستخدمين' : 'User IDs'}</label>
                              <div className="space-y-1">
                                {selectedVisitor.user_ids.map((id, idx) => (
                                  <p key={idx} className="font-mono text-xs">{id}</p>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserX className="h-5 w-5 text-muted-foreground" />
                            <p className="text-muted-foreground">{locale === 'ar' ? 'لا يوجد حساب' : 'No account'}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{locale === 'ar' ? 'الموقع والجهاز' : 'Location & Device'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'الدولة' : 'Country'}</label>
                          <p>{selectedVisitor.country || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'المدينة' : 'City'}</label>
                          <p>{selectedVisitor.city || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'نوع الجهاز' : 'Device Type'}</label>
                          <p>{selectedVisitor.device_type || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'المتصفح' : 'Browser'}</label>
                          <p>{selectedVisitor.browser || '-'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'نظام التشغيل' : 'OS'}</label>
                          <p>{selectedVisitor.os || '-'}</p>
                        </div>
                        {selectedVisitor.referrer && (
                          <div>
                            <label className="text-muted-foreground">{locale === 'ar' ? 'المصدر' : 'Referrer'}</label>
                            <p className="text-xs break-all">{selectedVisitor.referrer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{locale === 'ar' ? 'مقاييس التفاعل' : 'Engagement Metrics'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'نقاط التفاعل' : 'Engagement Score'}</label>
                          <p className="font-semibold">{formatNumber(selectedVisitor.engagement_score)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'مدة الجلسة المتوسطة' : 'Avg Session Duration'}</label>
                          <p>{formatDuration(selectedVisitor.avg_session_duration)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'صفحات لكل جلسة' : 'Pages per Session'}</label>
                          <p>{selectedVisitor.pages_per_session.toFixed(1)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'معدل الارتداد' : 'Bounce Rate'}</label>
                          <p>{selectedVisitor.bounce_rate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'إجمالي الأحداث' : 'Total Events'}</label>
                          <p>{formatNumber(selectedVisitor.total_events)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">{locale === 'ar' ? 'التحويلات' : 'Conversions'}</label>
                          <p className="font-semibold text-green-600">{formatNumber(selectedVisitor.total_conversions)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="sessions">
                  <Card>
                    <CardHeader>
                      <CardTitle>{locale === 'ar' ? 'الجلسات' : 'Sessions'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVisitor.sessions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {locale === 'ar' ? 'لا توجد جلسات' : 'No sessions found'}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {selectedVisitor.sessions.map((session, idx) => (
                            <div key={idx} className="p-4 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-mono text-sm">{session.id}</p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(session.start_time)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'مشاهدات:' : 'Views:'}</span> {session.page_views || 0}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'أحداث:' : 'Events:'}</span> {session.events_count || 0}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'مدة:' : 'Duration:'}</span> {formatDuration(session.duration_seconds || 0)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'تفاعل:' : 'Engagement:'}</span> {session.engagement_score || 0}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle>{locale === 'ar' ? 'الأحداث' : 'Events'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVisitor.events.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {locale === 'ar' ? 'لا توجد أحداث' : 'No events found'}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {selectedVisitor.events.slice(0, 100).map((event, idx) => (
                            <div key={idx} className="p-3 border rounded text-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{event.event_type}</p>
                                  {event.event_category && (
                                    <p className="text-xs text-muted-foreground">
                                      {event.event_category} {event.event_label && `• ${event.event_label}`}
                                    </p>
                                  )}
                                  {event.page_path && (
                                    <p className="text-xs font-mono text-muted-foreground">{event.page_path}</p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.created_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {selectedVisitor.events.length > 100 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              {locale === 'ar' 
                                ? `و ${selectedVisitor.events.length - 100} حدث آخر`
                                : `And ${selectedVisitor.events.length - 100} more events`}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="journey">
                  <Card>
                    <CardHeader>
                      <CardTitle>{locale === 'ar' ? 'مسار المستخدم' : 'User Journey'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVisitor.user_journey.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {locale === 'ar' ? 'لا يوجد مسار' : 'No journey data'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedVisitor.user_journey.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                {step.step_number}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{step.page_path}</p>
                                {step.event_type && (
                                  <p className="text-sm text-muted-foreground">{step.event_type}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(step.timestamp)}
                                  {step.time_from_previous && (
                                    <span className="ml-2">
                                      {locale === 'ar' ? `+${Math.round(step.time_from_previous / 1000)}s` : `+${Math.round(step.time_from_previous / 1000)}s`}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {selectedVisitor.has_account && (
                  <TabsContent value="accounts">
                    <Card>
                      <CardHeader>
                        <CardTitle>{locale === 'ar' ? 'الحسابات المرتبطة' : 'Linked Accounts'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedVisitor.profiles.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            {locale === 'ar' ? 'لا توجد حسابات' : 'No accounts found'}
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {selectedVisitor.profiles.map((profile) => (
                              <div key={profile.id} className="p-4 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">{profile.display_name || profile.email || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{profile.id}</p>
                                  </div>
                                  {profile.is_primary && (
                                    <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                                      {locale === 'ar' ? 'أساسي' : 'Primary'}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">{locale === 'ar' ? 'الإيميل:' : 'Email:'}</span> {profile.email || '-'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">{locale === 'ar' ? 'اليوزرنيم:' : 'Username:'}</span> {profile.username_custom || profile.username_random || '-'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</span> {formatDate(profile.created_at)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">{locale === 'ar' ? 'القالب:' : 'Template:'}</span> {profile.template_id || '-'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

