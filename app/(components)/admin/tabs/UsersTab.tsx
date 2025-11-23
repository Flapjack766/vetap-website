'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, MapPin, Globe, Mail, Calendar, User, Phone, Link as LinkIcon, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle, AtSign, Network, Activity, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  location: string | null;
  created_at: string;
  username_custom: string | null;
  username_random: string | null;
  is_primary: boolean;
  country?: string;
  city?: string | null;
}

interface FullUserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  links: any;
  template_id: number | null;
  username_random: string | null;
  username_custom: string | null;
  username_type: string | null;
  custom_username_expires_at: string | null;
  custom_username_expired: boolean | null;
  profile_name: string | null;
  is_primary: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  country?: string;
  city?: string | null;
  // Additional data
  authEmail?: string | null;
  allProfiles?: any[];
  usernameRequests?: any[];
  templateRequests?: any[];
  ipAddresses?: { ip: string; created_at: string; country?: string; city?: string }[];
  lastIp?: string;
  lastLogin?: string;
  totalLogins?: number;
}

interface UsersTabProps {
  locale: string;
}

export function UsersTab({ locale }: UsersTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    countries: new Set<string>(),
    cities: new Set<string>(),
  });
  const [selectedUser, setSelectedUser] = useState<FullUserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Helper function to parse location string
  const parseLocation = (location: string | null) => {
    if (!location) return { city: null, country: null };
    
    const trimmed = location.trim();
    if (!trimmed) return { city: null, country: null };
    
    // Check if it contains comma (multiple parts)
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(s => s);
      
      if (parts.length >= 2) {
        // Try to determine which is country and which is city
        // Common patterns:
        // 1. "City, Country" (English format)
        // 2. "Country, City" (Arabic format like "تركيا، اسطنبول")
        
        // Check if first part looks like a country name (common countries)
        const commonCountries = [
          'تركيا', 'turkey', 'السعودية', 'saudi arabia', 'saudi', 'مصر', 'egypt',
          'الامارات', 'uae', 'united arab emirates', 'العراق', 'iraq',
          'الاردن', 'jordan', 'لبنان', 'lebanon', 'سوريا', 'syria',
          'الكويت', 'kuwait', 'عمان', 'oman', 'قطر', 'qatar', 'البحرين', 'bahrain',
          'اليمن', 'yemen', 'المغرب', 'morocco', 'الجزائر', 'algeria',
          'تونس', 'tunisia', 'ليبيا', 'libya', 'السودان', 'sudan',
          'usa', 'united states', 'uk', 'united kingdom', 'france', 'germany',
          'italy', 'spain', 'canada', 'australia', 'india', 'china', 'japan'
        ];
        
        const firstPartLower = parts[0].toLowerCase();
        const lastPartLower = parts[parts.length - 1].toLowerCase();
        
        // Check if first part is a country
        const firstIsCountry = commonCountries.some(country => 
          firstPartLower.includes(country.toLowerCase()) || 
          country.toLowerCase().includes(firstPartLower)
        );
        
        // Check if last part is a country
        const lastIsCountry = commonCountries.some(country => 
          lastPartLower.includes(country.toLowerCase()) || 
          country.toLowerCase().includes(lastPartLower)
        );
        
        if (firstIsCountry && !lastIsCountry) {
          // Format: "Country, City"
          return { city: parts[1], country: parts[0] };
        } else if (lastIsCountry && !firstIsCountry) {
          // Format: "City, Country"
          return { city: parts[0], country: parts[parts.length - 1] };
        } else {
          // Default: assume "City, Country" format
          return { city: parts[0], country: parts[parts.length - 1] };
        }
      } else if (parts.length === 1) {
        return { city: parts[0], country: null };
      }
    }
    
    // Single value - could be city or country
    // Try to determine if it's a country
    const commonCountries = [
      'تركيا', 'turkey', 'السعودية', 'saudi arabia', 'saudi', 'مصر', 'egypt',
      'الامارات', 'uae', 'united arab emirates', 'العراق', 'iraq',
      'الاردن', 'jordan', 'لبنان', 'lebanon', 'سوريا', 'syria',
      'الكويت', 'kuwait', 'عمان', 'oman', 'قطر', 'qatar', 'البحرين', 'bahrain',
      'اليمن', 'yemen', 'المغرب', 'morocco', 'الجزائر', 'algeria',
      'تونس', 'tunisia', 'ليبيا', 'libya', 'السودان', 'sudan',
      'usa', 'united states', 'uk', 'united kingdom', 'france', 'germany',
      'italy', 'spain', 'canada', 'australia', 'india', 'china', 'japan'
    ];
    
    const trimmedLower = trimmed.toLowerCase();
    const isCountry = commonCountries.some(country => 
      trimmedLower.includes(country.toLowerCase()) || 
      country.toLowerCase().includes(trimmedLower)
    );
    
    if (isCountry) {
      return { city: null, country: trimmed };
    } else {
      return { city: trimmed, country: null };
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all profiles (admin can view all)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, email, location, created_at, username_custom, username_random, is_primary')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Fetch location data from analytics_events (REAL location data from IP geolocation)
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('country, city, profile_id')
        .not('country', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);

      // Log for debugging
      if (analyticsError) {
        console.warn('Error fetching analytics for location:', analyticsError);
      }
      console.log('Analytics data with location:', analyticsData?.length || 0, 'events');

      // Create a map of profile_id -> most recent location data from analytics
      const profileLocationMap = new Map<string, { country: string; city: string | null }>();
      
      if (analyticsData && analyticsData.length > 0) {
        analyticsData.forEach((event) => {
          if (event.profile_id && event.country) {
            // Only keep the first (most recent) location for each profile
            if (!profileLocationMap.has(event.profile_id)) {
              profileLocationMap.set(event.profile_id, {
                country: event.country.trim(),
                city: event.city ? event.city.trim() : null,
              });
            }
          }
        });
      }

      // Get unique users (by user_id) - only primary profiles or first profile
      const uniqueUsersMap = new Map<string, UserProfile & { country?: string; city?: string | null }>();
      const countriesSet = new Set<string>();
      const citiesSet = new Set<string>();

      // Process profiles and enrich with location data
      (profilesData || []).forEach((profile) => {
        // Get location from analytics_events (most reliable)
        let country: string | undefined = undefined;
        let city: string | null | undefined = undefined;
        
        // Try to get from analytics_events first
        const analyticsLocation = profileLocationMap.get(profile.id);
        if (analyticsLocation) {
          country = analyticsLocation.country;
          city = analyticsLocation.city;
          if (country) countriesSet.add(country);
          if (city) citiesSet.add(city);
        } else {
          // Fallback to profile.location field if no analytics data
          if (profile.location) {
            const locationStr = profile.location.trim();
            if (locationStr) {
              const parsed = parseLocation(locationStr);
              if (parsed.country) {
                country = parsed.country;
                countriesSet.add(country);
              }
              if (parsed.city) {
                city = parsed.city;
                citiesSet.add(city);
              }
            }
          }
        }

        // Only add if it's the first profile for this user_id, or if it's primary
        if (!uniqueUsersMap.has(profile.user_id) || profile.is_primary) {
          // If we already have a non-primary, replace it with primary
          if (uniqueUsersMap.has(profile.user_id) && !uniqueUsersMap.get(profile.user_id)?.is_primary && profile.is_primary) {
            uniqueUsersMap.set(profile.user_id, { 
              ...profile as UserProfile, 
              country, 
              city 
            });
          } else if (!uniqueUsersMap.has(profile.user_id)) {
            uniqueUsersMap.set(profile.user_id, { 
              ...profile as UserProfile, 
              country, 
              city 
            });
          }
        } else {
          // Update existing user with location if not already set
          const existing = uniqueUsersMap.get(profile.user_id);
          if (existing && !existing.country && country) {
            existing.country = country;
            existing.city = city;
          }
        }
      });

      const uniqueUsers = Array.from(uniqueUsersMap.values());
      
      // Log for debugging
      console.log('Total users:', uniqueUsers.length);
      console.log('Countries found:', Array.from(countriesSet));
      console.log('Cities found:', Array.from(citiesSet));
      console.log('Profiles with location:', (profilesData || []).filter(p => p.location).length);
      
      setUsers(uniqueUsers);
      setStats({
        total: uniqueUsers.length,
        countries: countriesSet,
        cities: citiesSet,
      });
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || t('ADMIN30'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchUserDetails = async (userId: string, profileId: string) => {
    try {
      setLoadingDetails(true);
      
      // Fetch full profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Fetch auth user email (the email used for login)
      // Note: auth.admin is only available on server-side, so we'll use the email from the first profile
      // In a real scenario, you'd want to create an API route to fetch this
      let authEmail: string | null = null;
      try {
        // Try to get from profiles first (usually the email in profiles matches auth email)
        const { data: primaryProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle();
        authEmail = primaryProfile?.email || profileData.email || null;
      } catch (err) {
        // Fallback to profile email
        authEmail = profileData.email || null;
      }

      // Fetch all profiles for this user
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Fetch all username requests for this user
      const { data: usernameRequests } = await supabase
        .from('username_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch all template requests for this user
      const { data: templateRequests } = await supabase
        .from('custom_template_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch IP addresses from analytics_events
      const { data: analyticsData } = await supabase
        .from('analytics_events')
        .select('ip_address, country, city, created_at')
        .eq('profile_id', profileId)
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get unique IPs with their first occurrence
      const uniqueIPs = new Map<string, { ip: string; created_at: string; country?: string; city?: string }>();
      if (analyticsData) {
        analyticsData.forEach((event: any) => {
          if (event.ip_address && !uniqueIPs.has(event.ip_address)) {
            uniqueIPs.set(event.ip_address, {
              ip: event.ip_address,
              created_at: event.created_at,
              country: event.country || undefined,
              city: event.city || undefined,
            });
          }
        });
      }

      const ipAddresses = Array.from(uniqueIPs.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Get last IP (most recent)
      const lastIp = ipAddresses.length > 0 ? ipAddresses[0].ip : undefined;
      const lastLogin = ipAddresses.length > 0 ? ipAddresses[0].created_at : undefined;
      const totalLogins = analyticsData?.length || 0;

      // Fetch location from analytics if available
      const { data: locationData } = await supabase
        .from('analytics_events')
        .select('country, city')
        .eq('profile_id', profileId)
        .not('country', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fullProfile: FullUserProfile = {
        ...profileData,
        country: locationData?.country || undefined,
        city: locationData?.city || undefined,
        authEmail,
        allProfiles: allProfiles || [],
        usernameRequests: usernameRequests || [],
        templateRequests: templateRequests || [],
        ipAddresses,
        lastIp,
        lastLogin,
        totalLogins,
      };

      setSelectedUser(fullProfile);
      setUserDetailsOpen(true);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoadingDetails(false);
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

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">{error}</div>
          <button
            onClick={fetchUsers}
            className="mt-4 mx-auto block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('ADMIN11')}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ADMIN31')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t('ADMIN32')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ADMIN33')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.countries.size}</div>
            <p className="text-xs text-muted-foreground">{t('ADMIN34')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ADMIN35')}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cities.size}</div>
            <p className="text-xs text-muted-foreground">{t('ADMIN36')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('ADMIN37')}</CardTitle>
          <CardDescription>{t('ADMIN38')}</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('ADMIN39')}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">{t('ADMIN40')}</th>
                      <th className="text-left p-3 font-medium">{t('ADMIN41')}</th>
                      <th className="text-left p-3 font-medium">{t('ADMIN42')}</th>
                      <th className="text-left p-3 font-medium">{t('ADMIN43')}</th>
                      <th className="text-left p-3 font-medium">{t('ADMIN44')}</th>
                      <th className="text-left p-3 font-medium">{t('ADMIN45')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      // Use real location data from analytics_events (if available) or fallback to parsed location
                      let city = user.city;
                      let country = user.country;
                      
                      // If no analytics data, try to parse from profile.location
                      if (!country && !city && user.location) {
                        const parsed = parseLocation(user.location);
                        city = parsed.city || undefined;
                        country = parsed.country || undefined;
                      }
                      
                      const username = user.username_custom || user.username_random || '-';
                      
                      return (
                        <tr 
                          key={user.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => fetchUserDetails(user.user_id, user.id)}
                        >
                          <td className="p-3">
                            <div className="font-medium">
                              {user.display_name || t('ADMIN15')}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{user.email || '-'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                              {username}
                            </code>
                          </td>
                          <td className="p-3">
                            {city ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{city}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {country ? (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{country}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(user.created_at)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedUser?.display_name || t('ADMIN15')}
            </DialogTitle>
            <DialogDescription>
              {locale === 'ar' ? 'جميع معلومات المستخدم' : 'Complete user information'}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'معرف البروفايل' : 'Profile ID'}</label>
                      <p className="text-sm font-mono">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'معرف المستخدم' : 'User ID'}</label>
                      <p className="text-sm font-mono">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {locale === 'ar' ? 'البريد الإلكتروني (البروفايل)' : 'Email (Profile)'}
                      </label>
                      <p className="text-sm">{selectedUser.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {locale === 'ar' ? 'البريد الإلكتروني (تسجيل الدخول)' : 'Email (Login/Auth)'}
                      </label>
                      <p className="text-sm font-semibold text-primary">{selectedUser.authEmail || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {locale === 'ar' ? 'الاسم المعروض' : 'Display Name'}
                      </label>
                      <p className="text-sm">{selectedUser.display_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'اسم البروفايل' : 'Profile Name'}</label>
                      <p className="text-sm">{selectedUser.profile_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'العنوان' : 'Headline'}</label>
                      <p className="text-sm">{selectedUser.headline || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {locale === 'ar' ? 'الوصف' : 'Bio'}
                      </label>
                      <p className="text-sm whitespace-pre-wrap">{selectedUser.bio || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {locale === 'ar' ? 'الهاتف' : 'Phone'}
                      </label>
                      <p className="text-sm">{selectedUser.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {locale === 'ar' ? 'الموقع' : 'Location'}
                      </label>
                      <p className="text-sm">{selectedUser.location || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {locale === 'ar' ? 'الدولة' : 'Country'}
                      </label>
                      <p className="text-sm">{selectedUser.country || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {locale === 'ar' ? 'المدينة' : 'City'}
                      </label>
                      <p className="text-sm">{selectedUser.city || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {locale === 'ar' ? 'رابط الصورة' : 'Avatar URL'}
                      </label>
                      {selectedUser.avatar_url ? (
                        <div className="space-y-2">
                          <img 
                            src={selectedUser.avatar_url} 
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <p className="text-xs font-mono break-all">{selectedUser.avatar_url}</p>
                        </div>
                      ) : (
                        <p className="text-sm">-</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Username Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات اسم المستخدم' : 'Username Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'اسم المستخدم العشوائي' : 'Random Username'}</label>
                      <p className="text-sm font-mono">{selectedUser.username_random || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'اسم المستخدم المخصص' : 'Custom Username'}</label>
                      <p className="text-sm font-mono">{selectedUser.username_custom || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'نوع اسم المستخدم' : 'Username Type'}</label>
                      <p className="text-sm">{selectedUser.username_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {selectedUser.custom_username_expired ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {locale === 'ar' ? 'حالة اسم المستخدم المخصص' : 'Custom Username Status'}
                      </label>
                      <p className="text-sm">
                        {selectedUser.custom_username_expired 
                          ? (locale === 'ar' ? 'منتهي الصلاحية' : 'Expired')
                          : selectedUser.username_custom 
                            ? (locale === 'ar' ? 'نشط' : 'Active')
                            : '-'
                        }
                      </p>
                    </div>
                    {selectedUser.custom_username_expires_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {locale === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expires At'}
                        </label>
                        <p className="text-sm">{formatDateTime(selectedUser.custom_username_expires_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              {selectedUser.links && typeof selectedUser.links === 'object' && Object.keys(selectedUser.links).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      {locale === 'ar' ? 'الروابط' : 'Links'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(selectedUser.links as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm font-medium">{key}</span>
                          <a 
                            href={value?.url || value} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {value?.url || value}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Emails */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {locale === 'ar' ? 'جميع الإيميلات' : 'All Email Addresses'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedUser.authEmail && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{selectedUser.authEmail}</p>
                            <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'إيميل تسجيل الدخول (الأصلي)' : 'Login Email (Primary)'}</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    )}
                    {selectedUser.allProfiles && selectedUser.allProfiles.length > 0 && (
                      <>
                        {selectedUser.allProfiles
                          .filter(p => p.email && p.email !== selectedUser.authEmail)
                          .map((profile, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm">{profile.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {locale === 'ar' ? 'بروفايل:' : 'Profile:'} {profile.profile_name || profile.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        {selectedUser.allProfiles.filter(p => p.email && p.email !== selectedUser.authEmail).length === 0 && (
                          <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'لا توجد إيميلات إضافية' : 'No additional emails'}</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* All Profiles */}
              {selectedUser.allProfiles && selectedUser.allProfiles.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {locale === 'ar' ? 'جميع البروفايلات' : 'All Profiles'} ({selectedUser.allProfiles.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedUser.allProfiles.map((profile, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{profile.profile_name || `Profile ${idx + 1}`}</p>
                                {profile.is_primary && (
                                  <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                                    {locale === 'ar' ? 'أساسي' : 'Primary'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">{profile.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {locale === 'ar' ? 'تم الإنشاء:' : 'Created:'} {formatDate(profile.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {profile.username_custom || profile.username_random || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Username Requests */}
              {selectedUser.usernameRequests && selectedUser.usernameRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AtSign className="h-5 w-5" />
                      {locale === 'ar' ? 'طلبات اسم المستخدم' : 'Username Requests'} ({selectedUser.usernameRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedUser.usernameRequests.map((request: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{request.username}</code>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                request.status === 'approved' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                                request.status === 'rejected' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                                'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                              }`}>
                                {request.status === 'approved' ? (locale === 'ar' ? 'موافق' : 'Approved') :
                                 request.status === 'rejected' ? (locale === 'ar' ? 'مرفوض' : 'Rejected') :
                                 (locale === 'ar' ? 'قيد الانتظار' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span>{locale === 'ar' ? 'المدة:' : 'Period:'}</span> {request.period || '-'}
                            </div>
                            <div>
                              <span>{locale === 'ar' ? 'تاريخ الطلب:' : 'Requested:'}</span> {formatDate(request.created_at)}
                            </div>
                            {request.start_date && (
                              <div>
                                <span>{locale === 'ar' ? 'تاريخ البدء:' : 'Start Date:'}</span> {formatDate(request.start_date)}
                              </div>
                            )}
                            {request.expires_at && (
                              <div>
                                <span>{locale === 'ar' ? 'تاريخ الانتهاء:' : 'Expires:'}</span> {formatDate(request.expires_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Template Requests */}
              {selectedUser.templateRequests && selectedUser.templateRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {locale === 'ar' ? 'طلبات القوالب' : 'Template Requests'} ({selectedUser.templateRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedUser.templateRequests.map((request: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium">{request.title || (locale === 'ar' ? 'طلب قالب' : 'Template Request')}</p>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                request.status === 'approved' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                                request.status === 'rejected' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                                'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                              }`}>
                                {request.status === 'approved' ? (locale === 'ar' ? 'موافق' : 'Approved') :
                                 request.status === 'rejected' ? (locale === 'ar' ? 'مرفوض' : 'Rejected') :
                                 (locale === 'ar' ? 'قيد الانتظار' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          {request.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{request.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <span>{locale === 'ar' ? 'تاريخ الطلب:' : 'Requested:'}</span> {formatDate(request.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IP Addresses */}
              {selectedUser.ipAddresses && selectedUser.ipAddresses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      {locale === 'ar' ? 'عناوين IP' : 'IP Addresses'} ({selectedUser.ipAddresses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedUser.lastIp && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold font-mono">{selectedUser.lastIp}</p>
                              <p className="text-xs text-muted-foreground">
                                {locale === 'ar' ? 'آخر IP' : 'Last IP'}
                                {selectedUser.lastLogin && ` • ${formatDateTime(selectedUser.lastLogin)}`}
                              </p>
                            </div>
                            <Activity className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedUser.ipAddresses.slice(0, 20).map((ipData, idx) => (
                          <div key={idx} className="p-2 bg-muted rounded border">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-mono">{ipData.ip}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {ipData.country && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {ipData.country}
                                    </span>
                                  )}
                                  {ipData.city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {ipData.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                {formatDateTime(ipData.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedUser.ipAddresses.length > 20 && (
                          <p className="text-xs text-muted-foreground text-center">
                            {locale === 'ar' ? `و ${selectedUser.ipAddresses.length - 20} عنوان IP آخر` : `And ${selectedUser.ipAddresses.length - 20} more IP addresses`}
                          </p>
                        )}
                      </div>
                      {selectedUser.totalLogins !== undefined && (
                        <div className="mt-3 p-2 bg-muted rounded text-center">
                          <p className="text-sm">
                            <span className="font-semibold">{selectedUser.totalLogins}</span> {locale === 'ar' ? 'زيارة إجمالية' : 'total visits'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات إضافية' : 'Additional Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'معرف القالب' : 'Template ID'}</label>
                      <p className="text-sm">{selectedUser.template_id || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {selectedUser.is_primary ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        {locale === 'ar' ? 'البروفايل الأساسي' : 'Primary Profile'}
                      </label>
                      <p className="text-sm">{selectedUser.is_primary ? (locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'ar' ? 'لا' : 'No')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {selectedUser.is_deleted ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {locale === 'ar' ? 'محذوف' : 'Deleted'}
                      </label>
                      <p className="text-sm">{selectedUser.is_deleted ? (locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'ar' ? 'لا' : 'No')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                      </label>
                      <p className="text-sm">{formatDateTime(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {locale === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                      </label>
                      <p className="text-sm">{formatDateTime(selectedUser.updated_at)}</p>
                    </div>
                    {selectedUser.totalLogins !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          {locale === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                        </label>
                        <p className="text-sm font-semibold">{selectedUser.totalLogins}</p>
                      </div>
                    )}
                    {selectedUser.lastLogin && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          {locale === 'ar' ? 'آخر دخول' : 'Last Login'}
                        </label>
                        <p className="text-sm">{formatDateTime(selectedUser.lastLogin)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

