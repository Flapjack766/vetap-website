'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, MapPin, Globe, Mail, Calendar } from 'lucide-react';

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
                        <tr key={user.id} className="border-b hover:bg-muted/50">
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
    </div>
  );
}

