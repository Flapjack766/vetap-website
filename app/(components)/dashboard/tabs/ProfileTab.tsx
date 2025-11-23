'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Upload, X, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';

// Dynamically import template components for live preview
const Template1Profile = dynamic(() => import('@/app/(components)/profile/templates/Template1Profile').then(mod => ({ default: mod.Template1Profile })), { ssr: false });
const Template2Profile = dynamic(() => import('@/app/(components)/profile/templates/Template2Profile').then(mod => ({ default: mod.Template2Profile })), { ssr: false });
const Template3Profile = dynamic(() => import('@/app/(components)/profile/templates/Template3Profile').then(mod => ({ default: mod.Template3Profile })), { ssr: false });
const Template4Profile = dynamic(() => import('@/app/(components)/profile/templates/Template4Profile').then(mod => ({ default: mod.Template4Profile })), { ssr: false });
const Template5Profile = dynamic(() => import('@/app/(components)/profile/templates/Template5Profile').then(mod => ({ default: mod.Template5Profile })), { ssr: false });

interface ProfileTabProps {
  profile: any;
  locale: string;
  onUpdate: (profile: any) => void;
  onNext?: () => void;
}

export function ProfileTab({ profile, locale, onUpdate, onNext }: ProfileTabProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const { success: showSuccess, error: showError } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    email: profile.email || '',
    location: profile.location || '',
    avatar_url: profile.avatar_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url || null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update form data when profile changes (when switching between profiles)
  useEffect(() => {
    setFormData({
      display_name: profile.display_name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      email: profile.email || '',
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
    });
    setPreviewUrl(profile.avatar_url || null);
    setError(null);
    setSuccess(false);
  }, [profile.id, profile.display_name, profile.headline, profile.bio, profile.phone, profile.email, profile.location, profile.avatar_url]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('DASH45'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('DASH46'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('DASH7'));
        setUploading(false);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Delete old avatar if exists
      if (formData.avatar_url && formData.avatar_url.includes('supabase.co/storage')) {
        try {
          const urlParts = formData.avatar_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1]?.split('?')[0];
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([oldFileName]);
          }
        } catch (err) {
          // Ignore deletion errors
          console.log('Could not delete old avatar:', err);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(uploadError.message || t('DASH47'));
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setFormData({ ...formData, avatar_url: urlData.publicUrl });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(t('DASH47'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar_url: '' });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (): Promise<boolean> => {
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

      // Update profile - use profile.id to update the specific profile (not user_id)
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          headline: formData.headline || null,
          bio: formData.bio || null,
          phone: formData.phone || null,
          email: formData.email || null,
          location: formData.location || null,
          avatar_url: formData.avatar_url || null,
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
          showError(errorMessage);
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
        
        const errorMsg = t('DASH8');
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
        return false;
      }

      setSuccess(true);
      showSuccess(t('DASH10'));
      onUpdate(updatedProfile);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
      return true;
    } catch (err) {
      const errorMsg = t('DASH8');
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  // Create preview profile data from form data
  const previewProfile = {
    ...profile,
    display_name: formData.display_name || profile.display_name,
    headline: formData.headline || profile.headline,
    bio: formData.bio || profile.bio,
    phone: formData.phone || profile.phone,
    email: formData.email || profile.email,
    location: formData.location || profile.location,
    avatar_url: previewUrl || formData.avatar_url || profile.avatar_url,
  };

  // Get template component based on profile template_id
  const getTemplateComponent = () => {
    const templateId = profile.template_id || 1;
    switch (templateId) {
      case 1:
        return <Template1Profile profile={previewProfile} locale={locale} />;
      case 2:
        return <Template2Profile profile={previewProfile} locale={locale} />;
      case 3:
        return <Template3Profile profile={previewProfile} locale={locale} />;
      case 4:
        return <Template4Profile profile={previewProfile} locale={locale} />;
      case 5:
        return <Template5Profile profile={previewProfile} locale={locale} />;
      default:
        return <Template1Profile profile={previewProfile} locale={locale} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle Preview Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? t('DASH_HIDE_PREVIEW') || 'Hide Preview' : t('DASH_SHOW_PREVIEW') || 'Show Preview'}
        </Button>
      </div>

      <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {/* Form Section */}
        <Card className={showPreview ? '' : 'w-full'}>
      <CardHeader>
        <CardTitle>{t('DASH3')}</CardTitle>
        <CardDescription>{t('DASH9')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Avatar Upload */}
          <div className="space-y-4">
            <Label>{t('DASH11')}</Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={previewUrl || formData.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {(formData.display_name || formData.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploading}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? t('DASH48') : t('DASH49')}
                  </Button>
                  {formData.avatar_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const url = prompt(t('DASH50'), formData.avatar_url);
                        if (url) {
                          setFormData({ ...formData, avatar_url: url });
                          setPreviewUrl(url);
                        }
                      }}
                      disabled={uploading}
                    >
                      {t('DASH51')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('DASH52')}
                </p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="display_name">{t('DASH13')}</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder={t('DASH14')}
              className="mt-1"
            />
          </div>

          {/* Headline */}
          <div>
            <Label htmlFor="headline">{t('DASH15')}</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder={t('DASH16')}
              className="mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">{t('DASH17')}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('DASH18')}
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">{t('AUTH3')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('AUTH3')}
              className="mt-1"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">{t('DASH19')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('DASH20')}
              className="mt-1"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">{t('DASH21')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('DASH22')}
              className="mt-1"
            />
          </div>

          {mounted && onNext ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t('DASH23') : t('DASH24')}
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={loading}
                onClick={async (e) => {
                  e.preventDefault();
                  // Save first, then navigate
                  const saved = await saveProfile();
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
            </div>
          ) : (
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('DASH23') : t('DASH24')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>

        {/* Live Preview Section */}
        {showPreview && (
          <Card className="sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-hidden">
            <CardHeader>
              <CardTitle>{t('DASH_PREVIEW') || 'Live Preview'}</CardTitle>
              <CardDescription>{t('DASH_PREVIEW_DESC') || 'See how your profile looks in real-time'}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-12rem)] w-full">
                <div className="scale-75 origin-top-left w-[133.33%] h-[133.33%] overflow-x-hidden" style={{ maxWidth: '100%' }}>
                  {getTemplateComponent()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

