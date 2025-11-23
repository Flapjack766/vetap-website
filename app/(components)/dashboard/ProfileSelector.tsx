'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, User, Star, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { useRouter } from 'next/navigation';
import { getMarginClass, getDirection } from '@/lib/utils/rtl';

interface ProfileSelectorProps {
  currentProfile: any;
  locale: string;
  onProfileChange: (profile: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function ProfileSelector({ currentProfile, locale, onProfileChange, onNavigateToTab }: ProfileSelectorProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [randomCount, setRandomCount] = useState(0);

  // Fetch all profiles for the user
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });

        if (!error && data) {
          setProfiles(data);
          // Count random profiles
          const randomProfiles = data.filter(p => p.username_type === 'random');
          setRandomCount(randomProfiles.length);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setCreateError('Profile name is required');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_name: newProfileName.trim(),
          username_type: 'random',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Failed to create profile');
        setCreating(false);
        return;
      }

      // Add new profile to list
      setProfiles(prev => [...prev, data.profile]);
      setRandomCount(prev => prev + 1);
      setNewProfileName('');
      setShowCreateDialog(false);
      router.refresh();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  const handleProfileSelect = (profile: any) => {
    onProfileChange(profile);
    router.refresh();
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const canCreateRandom = randomCount < 3;

  return (
    <Card className="mb-6" dir={dir}>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <p className="text-sm text-muted-foreground">
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
            </p>
          </div>
          
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!canCreateRandom}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('DASH56') || 'New Profile'}
                </Button>
              </DialogTrigger>
              <DialogContent dir={dir}>
                <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
                  <DialogTitle>{t('DASH57') || 'Create New Profile'}</DialogTitle>
                  <DialogDescription>
                    {t('DASH58') || 'Create a new random profile. You can have up to 3 random profiles.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile-name" className={isRTL ? 'text-right' : 'text-left'}>{t('DASH59') || 'Profile Name'}</Label>
                    <Input
                      id="profile-name"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder={t('DASH64') || 'e.g., Personal, Business, Portfolio'}
                      className="mt-1"
                      dir={dir}
                    />
                  </div>
                  {createError && (
                    <div className={`text-sm text-destructive ${isRTL ? 'text-right' : 'text-left'}`}>{createError}</div>
                  )}
                  {!canCreateRandom && (
                    <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('DASH65') || 'You have reached the maximum limit of 3 random profiles. Request a custom username for more profiles.'}
                    </div>
                  )}
                  <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-2`}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setNewProfileName('');
                        setCreateError(null);
                      }}
                    >
                      {t('DASH66') || 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleCreateProfile}
                      disabled={creating || !canCreateRandom}
                    >
                      {creating ? (
                        <>
                          <Loader2 className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')} animate-spin`} />
                          {t('DASH67') || 'Creating...'}
                        </>
                      ) : (
                        t('DASH68') || 'Create'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('link');
                }
              }}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              {t('DASH71')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {profiles.map((profile) => {
            const isSelected = profile.id === currentProfile.id;
            const isCustom = profile.username_type === 'custom';
            const username = profile.username_custom || profile.username_random;
            const url = `/${locale}/p/${username}`;

            return (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h4 className="font-medium truncate">
                        {profile.profile_name || profile.display_name || `Profile ${profile.id.slice(0, 8)}`}
                      </h4>
                      {profile.is_primary && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {t('DASH69') || 'Primary'}
                        </span>
                      )}
                      {isCustom && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate" dir="ltr">
                      /p/{username}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('DASH70') || 'No profiles yet. Create your first profile!'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

