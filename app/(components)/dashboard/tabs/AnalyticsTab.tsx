'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, Users, Globe, Monitor, Smartphone, Tablet, TrendingUp, Calendar, MapPin, MousePointerClick, Download, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsTabProps {
  profile: any;
  locale: string;
}

interface AnalyticsStats {
  totalViews: number;
  uniqueVisitors: number;
  uniqueIPs: number;
  countriesCount: number;
  mobileViews: number;
  desktopViews: number;
  tabletViews: number;
}

interface DailyStat {
  date: string;
  total_views: number;
  unique_visitors: number;
  unique_ips: number;
}

interface TopReferrer {
  referrer: string;
  visit_count: number;
  unique_visitors: number;
}

interface TopCountry {
  country: string;
  visit_count: number;
  unique_visitors: number;
}

export function AnalyticsTab({ profile, locale }: AnalyticsTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([]);
  const [linkClicks, setLinkClicks] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, profile.id]); // Re-fetch when profile changes

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch overall stats (all event types for link clicks)
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Filter page views for stats
      const pageViewEvents = events?.filter(e => e.event_type === 'page_view') || [];

      if (eventsError) {
        throw eventsError;
      }

      // Calculate stats from page views only
      const uniqueSessions = new Set(pageViewEvents?.map(e => e.session_id).filter(Boolean) || []);
      const uniqueIPs = new Set(pageViewEvents?.map(e => e.ip_address).filter(Boolean) || []);
      const uniqueCountries = new Set(pageViewEvents?.map(e => e.country).filter(Boolean) || []);

      const calculatedStats: AnalyticsStats = {
        totalViews: pageViewEvents?.length || 0,
        uniqueVisitors: uniqueSessions.size,
        uniqueIPs: uniqueIPs.size,
        countriesCount: uniqueCountries.size,
        mobileViews: pageViewEvents?.filter(e => e.device_type === 'mobile').length || 0,
        desktopViews: pageViewEvents?.filter(e => e.device_type === 'desktop').length || 0,
        tabletViews: pageViewEvents?.filter(e => e.device_type === 'tablet').length || 0,
      };

      setStats(calculatedStats);

      // Calculate daily stats from page views
      const dailyStatsMap = new Map<string, {
        date: string;
        total_views: number;
        unique_visitors_set: Set<string>;
        unique_ips_set: Set<string>;
      }>();
      pageViewEvents?.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        const existing = dailyStatsMap.get(date) || {
          date,
          total_views: 0,
          unique_visitors_set: new Set<string>(),
          unique_ips_set: new Set<string>(),
        };
        existing.total_views++;
        if (event.session_id) {
          existing.unique_visitors_set.add(event.session_id);
        }
        if (event.ip_address) {
          existing.unique_ips_set.add(event.ip_address);
        }
        dailyStatsMap.set(date, existing);
      });

      const dailyStatsArray = Array.from(dailyStatsMap.values()).map(stat => ({
        date: stat.date,
        total_views: stat.total_views,
        unique_visitors: stat.unique_visitors_set?.size || 0,
        unique_ips: stat.unique_ips_set?.size || 0,
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailyStats(dailyStatsArray);

      // Calculate top referrers from page views
      const referrersMap = new Map<string, { visit_count: number; unique_visitors: Set<string> }>();
      pageViewEvents?.forEach(event => {
        if (event.referrer) {
          const existing = referrersMap.get(event.referrer) || {
            visit_count: 0,
            unique_visitors: new Set<string>(),
          };
          existing.visit_count++;
          if (event.session_id) {
            existing.unique_visitors.add(event.session_id);
          }
          referrersMap.set(event.referrer, existing);
        }
      });

      const referrersArray = Array.from(referrersMap.entries())
        .map(([referrer, data]) => ({
          referrer,
          visit_count: data.visit_count,
          unique_visitors: data.unique_visitors.size,
        }))
        .sort((a, b) => b.visit_count - a.visit_count)
        .slice(0, 10);

      setTopReferrers(referrersArray);

      // Calculate top countries from page views
      const countriesMap = new Map<string, { visit_count: number; unique_visitors: Set<string> }>();
      pageViewEvents?.forEach(event => {
        if (event.country) {
          const existing = countriesMap.get(event.country) || {
            visit_count: 0,
            unique_visitors: new Set<string>(),
          };
          existing.visit_count++;
          if (event.session_id) {
            existing.unique_visitors.add(event.session_id);
          }
          countriesMap.set(event.country, existing);
        }
      });

      const countriesArray = Array.from(countriesMap.entries())
        .map(([country, data]) => ({
          country,
          visit_count: data.visit_count,
          unique_visitors: data.unique_visitors.size,
        }))
        .sort((a, b) => b.visit_count - a.visit_count)
        .slice(0, 10);

      setTopCountries(countriesArray);

      // Calculate device breakdown from page views
      const deviceMap = new Map<string, {
        visit_count: number;
        unique_visitors: Set<string>;
        device_type: string;
        browser: string;
        os: string;
      }>();
      pageViewEvents?.forEach(event => {
        const key = `${event.device_type || 'unknown'}-${event.browser || 'unknown'}-${event.os || 'unknown'}`;
        const existing = deviceMap.get(key) || {
          visit_count: 0,
          unique_visitors: new Set<string>(),
          device_type: event.device_type || 'unknown',
          browser: event.browser || 'unknown',
          os: event.os || 'unknown',
        };
        existing.visit_count++;
        if (event.session_id) {
          existing.unique_visitors.add(event.session_id);
        }
        deviceMap.set(key, existing);
      });

      const deviceArray = Array.from(deviceMap.values())
        .map(data => ({
          device_type: data.device_type,
          browser: data.browser,
          os: data.os,
          visit_count: data.visit_count,
          unique_visitors: data.unique_visitors.size,
        }))
        .sort((a, b) => b.visit_count - a.visit_count)
        .slice(0, 20);

      setDeviceBreakdown(deviceArray);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(num);
  };

  const getReferrerDomain = (referrer: string) => {
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return referrer;
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      const url = `/api/analytics/export?profile_id=${profile.id}&format=${format}&time_range=${timeRange}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `analytics-${profile.id}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert(t('ANALYTICS35'));
    } finally {
      setExporting(false);
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

  return (
    <div className="space-y-6">
      {/* Time Range Selector & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{t('ANALYTICS1')}</CardTitle>
              <CardDescription>{t('ANALYTICS2')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="7d">{t('ANALYTICS3')}</option>
                <option value="30d">{t('ANALYTICS4')}</option>
                <option value="90d">{t('ANALYTICS5')}</option>
                <option value="all">{t('ANALYTICS6')}</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {t('ANALYTICS36')}
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
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ANALYTICS7')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalViews || 0)}</div>
            <p className="text-xs text-muted-foreground">{t('ANALYTICS8')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ANALYTICS9')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.uniqueVisitors || 0)}</div>
            <p className="text-xs text-muted-foreground">{t('ANALYTICS10')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ANALYTICS11')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.countriesCount || 0)}</div>
            <p className="text-xs text-muted-foreground">{t('ANALYTICS12')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ANALYTICS13')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalViews ? ((stats.uniqueVisitors / stats.totalViews) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{t('ANALYTICS14')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('ANALYTICS15')}</TabsTrigger>
          <TabsTrigger value="links">{t('ANALYTICS37')}</TabsTrigger>
          <TabsTrigger value="devices">{t('ANALYTICS16')}</TabsTrigger>
          <TabsTrigger value="sources">{t('ANALYTICS17')}</TabsTrigger>
          <TabsTrigger value="locations">{t('ANALYTICS18')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Daily Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS19')}</CardTitle>
              <CardDescription>{t('ANALYTICS20')}</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStats.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('ANALYTICS21')}
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyStats.slice(0, 14).reverse().map((stat) => {
                    const maxViews = Math.max(...dailyStats.map(s => s.total_views));
                    const percentage = maxViews > 0 ? (stat.total_views / maxViews) * 100 : 0;
                    
                    return (
                      <div key={stat.date} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{formatDate(stat.date)}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(stat.total_views)} {t('ANALYTICS22')}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Breakdown Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS23')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(stats?.mobileViews || 0)}</div>
                    <p className="text-sm text-muted-foreground">{t('ANALYTICS24')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Monitor className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(stats?.desktopViews || 0)}</div>
                    <p className="text-sm text-muted-foreground">{t('ANALYTICS25')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Tablet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(stats?.tabletViews || 0)}</div>
                    <p className="text-sm text-muted-foreground">{t('ANALYTICS26')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS38')}</CardTitle>
              <CardDescription>{t('ANALYTICS39')}</CardDescription>
            </CardHeader>
            <CardContent>
              {linkClicks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('ANALYTICS40')}
                </div>
              ) : (
                <div className="space-y-4">
                  {linkClicks.map((link, index) => {
                    const total = linkClicks.reduce((sum, l) => sum + l.click_count, 0);
                    const percentage = total > 0 ? (link.click_count / total) * 100 : 0;
                    const domain = (() => {
                      try {
                        const url = new URL(link.link_url);
                        return url.hostname.replace('www.', '');
                      } catch {
                        return link.link_url;
                      }
                    })();
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{domain}</p>
                              <p className="text-sm text-muted-foreground">
                                {link.link_type} • {formatNumber(link.unique_visitors)} {t('ANALYTICS9')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-bold">{formatNumber(link.click_count)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS27')}</CardTitle>
              <CardDescription>{t('ANALYTICS28')}</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceBreakdown.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('ANALYTICS21')}
                </div>
              ) : (
                <div className="space-y-4">
                  {deviceBreakdown.map((device, index) => {
                    const total = deviceBreakdown.reduce((sum, d) => sum + d.visit_count, 0);
                    const percentage = total > 0 ? (device.visit_count / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {device.device_type} • {device.browser} • {device.os}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(device.unique_visitors)} {t('ANALYTICS9')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatNumber(device.visit_count)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS29')}</CardTitle>
              <CardDescription>{t('ANALYTICS30')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topReferrers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('ANALYTICS31')}
                </div>
              ) : (
                <div className="space-y-4">
                  {topReferrers.map((referrer, index) => {
                    const total = topReferrers.reduce((sum, r) => sum + r.visit_count, 0);
                    const percentage = total > 0 ? (referrer.visit_count / total) * 100 : 0;
                    const domain = getReferrerDomain(referrer.referrer);
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{domain}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(referrer.unique_visitors)} {t('ANALYTICS9')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatNumber(referrer.visit_count)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('ANALYTICS32')}</CardTitle>
              <CardDescription>{t('ANALYTICS33')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topCountries.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('ANALYTICS21')}
                </div>
              ) : (
                <div className="space-y-4">
                  {topCountries.map((country, index) => {
                    const total = topCountries.reduce((sum, c) => sum + c.visit_count, 0);
                    const percentage = total > 0 ? (country.visit_count / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{country.country || t('ANALYTICS34')}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatNumber(country.unique_visitors)} {t('ANALYTICS9')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatNumber(country.visit_count)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

