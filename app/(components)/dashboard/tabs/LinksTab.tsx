'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDirection } from '@/lib/utils/rtl';

interface LinksTabProps {
  profile: any;
  locale: string;
  onUpdate: (profile: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

// Base URLs for social media platforms
const linkBaseUrls: Record<string, string> = {
  whatsapp: 'https://wa.me/',
  whatsapp_business: 'https://wa.me/',
  instagram: 'https://instagram.com/',
  snapchat: 'https://snapchat.com/add/',
  twitter: 'https://twitter.com/', // Kept for migration of old links
  x: 'https://x.com/',
  tiktok: 'https://tiktok.com/@',
  linkedin: 'https://linkedin.com/in/',
  facebook: 'https://facebook.com/',
  youtube: 'https://youtube.com/@',
  github: 'https://github.com/',
  website: '', // Website needs full URL
};

const defaultLinks = [
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '1234567890', prefix: '+', baseUrl: linkBaseUrls.whatsapp },
  { key: 'whatsapp_business', label: 'WhatsApp Business', placeholder: '1234567890', prefix: '+', baseUrl: linkBaseUrls.whatsapp_business },
  { key: 'instagram', label: 'Instagram', placeholder: 'username', baseUrl: linkBaseUrls.instagram },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'username', baseUrl: linkBaseUrls.snapchat },
  { key: 'x', label: 'Twitter / X', placeholder: 'username', baseUrl: linkBaseUrls.x },
  { key: 'tiktok', label: 'TikTok', placeholder: 'username', baseUrl: linkBaseUrls.tiktok },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'username', baseUrl: linkBaseUrls.linkedin },
  { key: 'facebook', label: 'Facebook', placeholder: 'username', baseUrl: linkBaseUrls.facebook },
  { key: 'youtube', label: 'YouTube', placeholder: 'username', baseUrl: linkBaseUrls.youtube },
  { key: 'github', label: 'GitHub', placeholder: 'username', baseUrl: linkBaseUrls.github },
  { key: 'website', label: 'Website', placeholder: 'https://example.com', baseUrl: '', isFullUrl: true },
];

export function LinksTab({ profile, locale, onUpdate, onNext, onPrevious }: LinksTabProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);

  const links = typeof profile.links === 'string' 
    ? JSON.parse(profile.links || '{}') 
    : (profile.links || {});

  // Extract usernames from full URLs
  const extractUsername = (key: string, fullUrl: string): string => {
    if (!fullUrl) return '';
    
    // For website, return full URL
    if (key === 'website') return fullUrl;
    
    // For WhatsApp, extract phone number
    if (key === 'whatsapp' || key === 'whatsapp_business') {
      const phone = fullUrl.replace(/[^0-9]/g, '');
      return phone;
    }
    
    // For other platforms, extract username from URL
    const baseUrl = linkBaseUrls[key];
    if (baseUrl && fullUrl.startsWith(baseUrl)) {
      return fullUrl.replace(baseUrl, '').replace(/\/$/, '');
    }
    
    // If URL doesn't match base, return as is (might be custom)
    return fullUrl;
  };

  // Initialize with extracted usernames
  const initialUsernames: Record<string, string> = {};
  defaultLinks.forEach((link) => {
    if (links[link.key]) {
      initialUsernames[link.key] = extractUsername(link.key, links[link.key]);
    }
  });
  
  // Migrate old 'twitter' links to 'x'
  if (links['twitter'] && !links['x']) {
    initialUsernames['x'] = extractUsername('twitter', links['twitter']);
  }

  const [usernames, setUsernames] = useState<Record<string, string>>(initialUsernames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update usernames when profile changes (when switching between profiles)
  useEffect(() => {
    const currentLinks = typeof profile.links === 'string' 
      ? JSON.parse(profile.links || '{}') 
      : (profile.links || {});
    
    const updatedUsernames: Record<string, string> = {};
    defaultLinks.forEach((link) => {
      if (currentLinks[link.key]) {
        updatedUsernames[link.key] = extractUsername(link.key, currentLinks[link.key]);
      }
    });
    
    // Migrate old 'twitter' links to 'x'
    if (currentLinks['twitter'] && !currentLinks['x']) {
      updatedUsernames['x'] = extractUsername('twitter', currentLinks['twitter']);
    }
    
    setUsernames(updatedUsernames);
    setError(null);
    setSuccess(false);
  }, [profile.id, profile.links]);

  const handleUsernameChange = (key: string, value: string) => {
    setUsernames((prev) => {
      const updated = { ...prev };
      if (value.trim()) {
        updated[key] = value.trim();
      } else {
        delete updated[key];
      }
      return updated;
    });
  };

  // Build full URLs from usernames
  const buildFullUrls = (): Record<string, string> => {
    const fullUrls: Record<string, string> = {};
    
    Object.entries(usernames).forEach(([key, username]) => {
      if (!username.trim()) return;
      
      const linkConfig = defaultLinks.find(l => l.key === key);
      if (!linkConfig) return;
      
      // Website needs full URL
      if (key === 'website') {
        let url = username.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }
        fullUrls[key] = url;
      }
      // WhatsApp needs phone number
      else if (key === 'whatsapp' || key === 'whatsapp_business') {
        const phone = username.replace(/[^0-9]/g, '');
        if (phone) {
          fullUrls[key] = `${linkConfig.baseUrl}${phone}`;
        }
      }
      // Other platforms: baseUrl + username
      else if (linkConfig.baseUrl) {
        fullUrls[key] = `${linkConfig.baseUrl}${username.trim()}`;
      }
    });
    
    return fullUrls;
  };

  const handleRemoveLink = (key: string) => {
    setUsernames((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const saveLinks = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('DASH7'));
        setLoading(false);
        return false;
      }

      // Build full URLs from usernames
      const fullUrls = buildFullUrls();
      
      // Remove old 'twitter' key if it exists (migrated to 'x')
      if (fullUrls['twitter']) {
        delete fullUrls['twitter'];
      }

      // Update profile - use select() to return updated data
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          links: fullUrls,
        })
        .eq('id', profile.id) // Use profile.id instead of user_id for multi-profile support
        .eq('user_id', user.id) // Also verify user_id for security
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Update error:', updateError);
        // Check if error is actually meaningful (not just empty object)
        const hasError = updateError.message || updateError.code || (Object.keys(updateError).length > 0 && JSON.stringify(updateError) !== '{}');
        
        if (hasError) {
          const errorMessage = updateError.message || updateError.code || JSON.stringify(updateError) || t('DASH8');
          setError(errorMessage);
          setLoading(false);
          return false;
        }
        // If error is empty object, continue to check if update actually worked
      }

      if (!updatedProfile) {
        // Try to fetch profile to see if update actually worked
        const { data: checkProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id) // Use profile.id instead of user_id
          .eq('user_id', user.id) // Also verify user_id for security
          .maybeSingle();
        
        if (checkProfile) {
          // Update worked, just couldn't return data - use fetched profile
          setSuccess(true);
          onUpdate(checkProfile);
          setTimeout(() => setSuccess(false), 3000);
          router.refresh();
          return true;
        }
        
        setError(t('DASH8'));
        setLoading(false);
        return false;
      }

      setSuccess(true);
      onUpdate(updatedProfile);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
      return true;
    } catch (err) {
      setError(t('DASH8'));
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLinks();
  };

  return (
    <Card dir="ltr">
      <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
        <CardTitle>{t('DASH4')}</CardTitle>
        <CardDescription>{t('DASH25')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" dir="ltr">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              {t('DASH10')}
            </div>
          )}

          <div className="space-y-4">
            {defaultLinks.map((link) => {
              const hasValue = usernames[link.key];
              const displayValue = usernames[link.key] || '';
              
              return (
                <div key={link.key} className="space-y-2">
                  <Label htmlFor={link.key} className="text-left">{link.label}</Label>
                  <div className="flex gap-2">
                    {link.key === 'website' ? (
                      // Website needs full URL input
                      <div className="flex-1">
                        <Input
                          id={link.key}
                          type="url"
                          value={displayValue}
                          onChange={(e) => handleUsernameChange(link.key, e.target.value)}
                          placeholder={link.placeholder}
                          className="mt-1"
                          dir="ltr"
                        />
                      </div>
                    ) : (
                      // Social media: show base URL + username input
                      <>
                        <div className="flex items-center px-3 py-2 bg-muted rounded-md border border-input text-sm text-muted-foreground whitespace-nowrap">
                          {link.prefix || ''}{link.baseUrl}
                        </div>
                        <div className="flex-1">
                          <Input
                            id={link.key}
                            type="text"
                            value={displayValue}
                            onChange={(e) => handleUsernameChange(link.key, e.target.value)}
                            placeholder={link.placeholder}
                            className="mt-1"
                            dir="ltr"
                          />
                        </div>
                      </>
                    )}
                    {hasValue && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-7"
                        onClick={() => handleRemoveLink(link.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {hasValue && link.key !== 'website' && (
                    <p className="text-xs text-muted-foreground">
                      {t('DASH44')}: {link.baseUrl}{displayValue}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {mounted && (onPrevious || onNext) ? (
            <div className="flex flex-col sm:flex-row gap-3">
              {onPrevious && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => onPrevious()}
                  className="flex-1"
                >
                  {t('NAV_PREV')}
                </Button>
              )}
              <Button type="submit" disabled={loading} className={onPrevious || onNext ? "flex-1" : "w-full"}>
                {loading ? t('DASH23') : t('DASH24')}
              </Button>
              {onNext && (
                <Button
                  type="button"
                  variant="default"
                  disabled={loading}
                  onClick={async (e) => {
                    e.preventDefault();
                    // Save first, then navigate
                    const saved = await saveLinks();
                    if (saved) {
                      setTimeout(() => {
                        onNext();
                      }, 500);
                    }
                  }}
                  className="flex-1"
                >
                  {t('NAV_NEXT')}
                </Button>
              )}
            </div>
          ) : (
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('DASH23') : t('DASH24')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

