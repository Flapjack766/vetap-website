'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Copy, ExternalLink, Calendar, AlertCircle, Loader2, Palette, Star, Upload, X, Image as ImageIcon, Eye, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { Textarea } from '@/app/(components)/ui/textarea';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';
import { getMarginClass, getPositionClass, getDirection } from '@/lib/utils/rtl';

// Dynamically import template components for live preview
const Template1Profile = dynamic(() => import('@/app/(components)/profile/templates/Template1Profile').then(mod => ({ default: mod.Template1Profile })), { ssr: false });
const Template2Profile = dynamic(() => import('@/app/(components)/profile/templates/Template2Profile').then(mod => ({ default: mod.Template2Profile })), { ssr: false });
const Template3Profile = dynamic(() => import('@/app/(components)/profile/templates/Template3Profile').then(mod => ({ default: mod.Template3Profile })), { ssr: false });
const Template4Profile = dynamic(() => import('@/app/(components)/profile/templates/Template4Profile').then(mod => ({ default: mod.Template4Profile })), { ssr: false });
const Template5Profile = dynamic(() => import('@/app/(components)/profile/templates/Template5Profile').then(mod => ({ default: mod.Template5Profile })), { ssr: false });
const CustomTemplateRenderer = dynamic(() => import('@/app/(components)/profile/CustomTemplateRenderer').then(mod => ({ default: mod.CustomTemplateRenderer })), { ssr: false });

interface LinkTabProps {
  profile: any;
  locale: string;
  activeSection?: string;
}

export function LinkTab({ profile, locale, activeSection }: LinkTabProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const { success: showSuccess, error: showError } = useToast();
  const [copied, setCopied] = useState(false);
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestedUsername, setRequestedUsername] = useState('');
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'year'>('month');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Site URL - use production URL instead of localhost
  const siteUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://vetaps.com')
    : 'https://vetaps.com';
  
  // Custom Template Request States
  const [showTemplateRequestForm, setShowTemplateRequestForm] = useState(false);
  const [templateRequestLoading, setTemplateRequestLoading] = useState(false);
  const [templateRequestError, setTemplateRequestError] = useState<string | null>(null);
  const [templateRequestSuccess, setTemplateRequestSuccess] = useState(false);
  const [pendingTemplateRequests, setPendingTemplateRequests] = useState<any[]>([]);
  const [templateFormData, setTemplateFormData] = useState({
    request_title: '',
    description: '',
    data_source: 'use_existing' as 'use_existing' | 'build_from_scratch',
    required_fields: [] as string[],
    color_scheme: '',
    layout_preference: '',
    special_features: '',
    reference_urls: '',
    additional_notes: '',
    custom_data: {} as Record<string, string>,
  });
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [loadingCustomTemplate, setLoadingCustomTemplate] = useState(false);
  
  // Branch Tracking Dashboard Request States
  const [branchTrackingRequestLoading, setBranchTrackingRequestLoading] = useState(false);
  const [branchTrackingRequestError, setBranchTrackingRequestError] = useState<string | null>(null);
  const [branchTrackingRequestSuccess, setBranchTrackingRequestSuccess] = useState(false);
  const [branchTrackingRequestStatus, setBranchTrackingRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const randomUrl = `/${locale}/p/${profile.username_random}`;
  const customUrl = profile.username_custom 
    ? `/${locale}/p/${profile.username_custom}`
    : null;

  const activeUrl = customUrl || randomUrl;
  const fullUrl = `${siteUrl}${activeUrl}`;

  const isCustomActive = profile.username_custom && 
    profile.custom_username_expires_at && 
    new Date(profile.custom_username_expires_at) > new Date();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    showSuccess(t('DASH32'));
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('username_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  // Fetch pending template requests
  const fetchPendingTemplateRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_template_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingTemplateRequests(data);
      }
    } catch (err) {
      console.error('Error fetching pending template requests:', err);
    }
  };

  // Fetch branch tracking request status
  const fetchBranchTrackingRequestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('branch_tracking_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBranchTrackingRequestStatus(data.status);
      }
    } catch (err) {
      console.error('Error fetching branch tracking request status:', err);
    }
  };

  // Load pending requests on mount and when profile changes
  useEffect(() => {
    fetchPendingRequests();
    fetchPendingTemplateRequests();
    fetchBranchTrackingRequestStatus();
  }, [profile.id]); // Re-fetch when profile changes

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open form when navigating to specific section
  useEffect(() => {
    if (activeSection === 'custom-username') {
      setShowRequestForm(true);
      setTimeout(() => {
        const element = document.getElementById('custom-username-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (activeSection === 'custom-template') {
      setShowTemplateRequestForm(true);
      setTimeout(() => {
        const element = document.getElementById('custom-template-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (activeSection === 'branch-tracking') {
      setTimeout(() => {
        const element = document.getElementById('branch-tracking-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [activeSection]);

  // Fetch custom template if needed
  useEffect(() => {
    if (profile.template_id === 999 && profile.custom_template_id && showPreview) {
      const fetchCustomTemplate = async () => {
        setLoadingCustomTemplate(true);
        try {
          const { data, error } = await supabase
            .from('custom_templates')
            .select('*, custom_template_requests(uploaded_images)')
            .eq('id', profile.custom_template_id)
            .eq('is_deleted', false)
            .maybeSingle();

          if (!error && data) {
            const templateWithImages = {
              ...data,
              uploaded_images: data.custom_template_requests?.[0]?.uploaded_images || {},
            };
            setCustomTemplate(templateWithImages);
          }
        } catch (err) {
          console.error('Error fetching custom template:', err);
        } finally {
          setLoadingCustomTemplate(false);
        }
      };

      fetchCustomTemplate();
    } else {
      setCustomTemplate(null);
    }
  }, [profile.template_id, profile.custom_template_id, showPreview]);

  // Get template preview component
  const getTemplatePreview = () => {
    const templateId = profile.template_id || 1;
    
    if (templateId === 999 && customTemplate) {
      // Custom template
      const profileWithImages = {
        ...profile,
        uploaded_images: customTemplate.uploaded_images || {},
      };
      return (
        <CustomTemplateRenderer 
          templateCode={customTemplate.template_code} 
          profile={profileWithImages} 
          locale={locale} 
        />
      );
    }

    if (templateId === 999 && loadingCustomTemplate) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Standard templates
    switch (templateId) {
      case 1:
        return <Template1Profile profile={profile} locale={locale} />;
      case 2:
        return <Template2Profile profile={profile} locale={locale} />;
      case 3:
        return <Template3Profile profile={profile} locale={locale} />;
      case 4:
        return <Template4Profile profile={profile} locale={locale} />;
      case 5:
        return <Template5Profile profile={profile} locale={locale} />;
      default:
        return <Template1Profile profile={profile} locale={locale} />;
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError(null);
    setRequestSuccess(false);

    const username = requestedUsername.trim().toLowerCase();

    // Frontend validation
    if (username.length < 3) {
      setRequestError(t('USERNAME1'));
      setRequestLoading(false);
      return;
    }

    if (username.length > 30) {
      setRequestError(t('USERNAME2'));
      setRequestLoading(false);
      return;
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      setRequestError(t('USERNAME3'));
      setRequestLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/username-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requested_username: username,
          period_type: periodType,
          profile_id: profile.id, // Link request to current profile
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Improved error messages
        let errorMessage = t('USERNAME4');
        if (data.error) {
          if (data.error.toLowerCase().includes('exists') || data.error.toLowerCase().includes('taken') || data.error.toLowerCase().includes('already')) {
            errorMessage = t('USERNAME_ERROR_EXISTS');
          } else if (data.error.toLowerCase().includes('invalid') || data.error.toLowerCase().includes('format')) {
            errorMessage = t('USERNAME_ERROR_INVALID');
          } else {
            errorMessage = data.error;
          }
        }
        setRequestError(errorMessage);
        showError(errorMessage);
        setRequestLoading(false);
        return;
      }

      setRequestSuccess(true);
      showSuccess(t('USERNAME7'));
      setRequestedUsername('');
      setShowRequestForm(false);
      await fetchPendingRequests();
      router.refresh();
      
      setTimeout(() => {
        setRequestSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting request:', err);
      const errorMsg = t('USERNAME_ERROR_NETWORK');
      setRequestError(errorMsg);
      showError(errorMsg);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleImageUpload = async (file: File, imageType: string) => {
    if (file.size > 5 * 1024 * 1024) {
      setTemplateRequestError(t('DASH46'));
      return;
    }

    setUploadingImage(imageType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${imageType}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        console.error('Error message:', uploadError.message);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('template-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setUploadedImages({ ...uploadedImages, [imageType]: urlData.publicUrl });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setTemplateRequestError(err.message || t('DASH47'));
    } finally {
      setUploadingImage(null);
    }
  };

  const handleTemplateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateRequestLoading(true);
    setTemplateRequestError(null);
    setTemplateRequestSuccess(false);

    if (!templateFormData.request_title.trim() || !templateFormData.description.trim()) {
      setTemplateRequestError(t('TEMPLATE1'));
      setTemplateRequestLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/custom-template-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: profile.id,
          ...templateFormData,
          uploaded_images: uploadedImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setTemplateRequestError(data.error || t('TEMPLATE2'));
        setTemplateRequestLoading(false);
        return;
      }

      setTemplateRequestSuccess(true);
      setTemplateFormData({
        request_title: '',
        description: '',
        data_source: 'use_existing',
        required_fields: [],
        color_scheme: '',
        layout_preference: '',
        special_features: '',
        reference_urls: '',
        additional_notes: '',
        custom_data: {},
      });
      setUploadedImages({});
      setShowTemplateRequestForm(false);
      await fetchPendingTemplateRequests();
      router.refresh();
      
      setTimeout(() => {
        setTemplateRequestSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting template request:', err);
      setTemplateRequestError(t('TEMPLATE2'));
    } finally {
      setTemplateRequestLoading(false);
    }
  };

  const handleBranchTrackingRequestSubmit = async () => {
    setBranchTrackingRequestLoading(true);
    setBranchTrackingRequestError(null);
    setBranchTrackingRequestSuccess(false);

    try {
      const response = await fetch('/api/branch-tracking-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: profile.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setBranchTrackingRequestSuccess(true);
      setBranchTrackingRequestStatus('pending');
      await fetchBranchTrackingRequestStatus();
    } catch (err: any) {
      console.error('Error submitting branch tracking request:', err);
      setBranchTrackingRequestError(err.message || 'Failed to submit request');
    } finally {
      setBranchTrackingRequestLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Toggle Preview Button */}
      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
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

      <div className={showPreview ? `grid grid-cols-1 lg:grid-cols-2 gap-6 ${isRTL ? 'lg:grid-flow-col-dense' : ''}` : ''}>
    <div className="space-y-6">
      {/* Random Username */}
      <Card>
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle>{t('DASH29')}</CardTitle>
          <CardDescription>{t('DASH30')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center gap-2 p-4 bg-muted rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
            <code className="flex-1 text-sm font-mono" dir="ltr">{activeUrl}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : ''}`} />
            </Button>
          </div>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" asChild className="flex-1">
              <Link href={activeUrl} target="_blank">
                <ExternalLink className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')}`} />
                {t('DASH31')}
              </Link>
            </Button>
            <Button variant="outline" onClick={handleCopy} className="flex-1">
              <Copy className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')}`} />
              {copied ? t('DASH32') : t('DASH33')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Username Status */}
      <Card id="custom-username-section">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle>{t('DASH34')}</CardTitle>
          <CardDescription>{t('DASH35')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCustomActive ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-semibold mb-1">{t('DASH36')}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('DASH37')}: <code className="px-2 py-1 bg-muted rounded text-sm" dir="ltr">{profile.username_custom}</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('DASH38')}: {formatDate(profile.custom_username_expires_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : profile.username_custom && new Date(profile.custom_username_expires_at) <= new Date() ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-semibold mb-1">{t('DASH39')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('DASH40')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-10 w-10 rounded-full bg-muted-foreground/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-semibold mb-1">{t('DASH41')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('DASH42')}
                    </p>
                    <Button onClick={() => setShowRequestForm(!showRequestForm)}>
                      {t('DASH43')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Request Form */}
              {showRequestForm && (
                <Card>
                  <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
                    <CardTitle>{t('USERNAME5')}</CardTitle>
                    <CardDescription>{t('USERNAME6')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      {requestError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                          {requestError}
                        </div>
                      )}

                      {requestSuccess && (
                        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                          {t('USERNAME7')}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username" className={isRTL ? 'text-right' : 'text-left'}>{t('USERNAME8')}</Label>
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="flex items-center px-3 py-2 bg-muted rounded-md border border-input text-sm text-muted-foreground" dir="ltr">
                            {siteUrl}/{locale}/p/
                          </span>
                          <Input
                            id="username"
                            type="text"
                            value={requestedUsername}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              setRequestedUsername(value);
                              setRequestError(null);
                            }}
                            placeholder="username"
                            className="flex-1"
                            maxLength={30}
                            disabled={requestLoading}
                            dir="ltr"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('USERNAME9')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="period" className={isRTL ? 'text-right' : 'text-left'}>{t('USERNAME10')}</Label>
                        <select
                          id="period"
                          value={periodType}
                          onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'year')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={requestLoading}
                          dir={dir}
                        >
                          <option value="week">{t('USERNAME11')}</option>
                          <option value="month">{t('USERNAME12')}</option>
                          <option value="year">{t('USERNAME13')}</option>
                        </select>
                      </div>

                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button
                          type="submit"
                          disabled={requestLoading || !requestedUsername.trim()}
                          className="flex-1"
                        >
                          {requestLoading ? (
                            <>
                              <Loader2 className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')} animate-spin`} />
                              {t('USERNAME14')}
                            </>
                          ) : (
                            t('USERNAME15')
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowRequestForm(false);
                            setRequestedUsername('');
                            setRequestError(null);
                          }}
                          disabled={requestLoading}
                        >
                          {t('USERNAME16')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <Card>
                  <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
                    <CardTitle>{t('USERNAME17')}</CardTitle>
                    <CardDescription>{t('USERNAME18')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`p-3 bg-muted rounded-lg flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="font-medium">
                              <code className="px-2 py-1 bg-background rounded text-sm" dir="ltr">
                                {request.requested_username}
                              </code>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('USERNAME19')}: {t(`USERNAME${request.period_type === 'week' ? '11' : request.period_type === 'month' ? '12' : '13'}`)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('USERNAME20')}: {formatDate(request.created_at)}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium">
                            {t('USERNAME21')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Template Request */}
      <Card id="custom-template-section">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Palette className="h-5 w-5" />
            {t('TEMPLATE3')}
          </CardTitle>
          <CardDescription>{t('TEMPLATE4')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="font-semibold mb-1">{t('TEMPLATE5')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('TEMPLATE6')}
                </p>
                <Button onClick={() => setShowTemplateRequestForm(!showTemplateRequestForm)}>
                  {t('TEMPLATE7')}
                </Button>
              </div>
            </div>
          </div>

          {/* Template Request Form */}
          {showTemplateRequestForm && (
            <Card>
              <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
                <CardTitle>{t('TEMPLATE8')}</CardTitle>
                <CardDescription>{t('TEMPLATE9')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTemplateRequestSubmit} className="space-y-4">
                  {templateRequestError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {templateRequestError}
                    </div>
                  )}

                  {templateRequestSuccess && (
                    <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                      {t('TEMPLATE10')}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="request_title" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE11')} *</Label>
                    <Input
                      id="request_title"
                      type="text"
                      value={templateFormData.request_title}
                      onChange={(e) => {
                        setTemplateFormData({ ...templateFormData, request_title: e.target.value });
                        setTemplateRequestError(null);
                      }}
                      placeholder={t('TEMPLATE12')}
                      disabled={templateRequestLoading}
                      required
                      dir={dir}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE13')} *</Label>
                    <Textarea
                      id="description"
                      value={templateFormData.description}
                      onChange={(e) => {
                        setTemplateFormData({ ...templateFormData, description: e.target.value });
                        setTemplateRequestError(null);
                      }}
                      placeholder={t('TEMPLATE14')}
                      rows={4}
                      disabled={templateRequestLoading}
                      required
                      dir={dir}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE60')}</Label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                          type="radio"
                          name="data_source"
                          value="use_existing"
                          checked={templateFormData.data_source === 'use_existing'}
                          onChange={(e) => setTemplateFormData({ ...templateFormData, data_source: e.target.value as 'use_existing' | 'build_from_scratch' })}
                          className="w-4 h-4"
                          disabled={templateRequestLoading}
                        />
                        <span>{t('TEMPLATE61')}</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                          type="radio"
                          name="data_source"
                          value="build_from_scratch"
                          checked={templateFormData.data_source === 'build_from_scratch'}
                          onChange={(e) => setTemplateFormData({ ...templateFormData, data_source: e.target.value as 'use_existing' | 'build_from_scratch' })}
                          className="w-4 h-4"
                          disabled={templateRequestLoading}
                        />
                        <span>{t('TEMPLATE62')}</span>
                      </label>
                    </div>
                  </div>

                  {templateFormData.data_source === 'build_from_scratch' && (
                    <>
                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE63')}</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                          {['display_name', 'headline', 'bio', 'email', 'phone', 'location', 'avatar', 'links'].map((field) => (
                            <label key={field} className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <input
                                type="checkbox"
                                checked={templateFormData.required_fields.includes(field)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTemplateFormData({
                                      ...templateFormData,
                                      required_fields: [...templateFormData.required_fields, field],
                                    });
                                  } else {
                                    setTemplateFormData({
                                      ...templateFormData,
                                      required_fields: templateFormData.required_fields.filter(f => f !== field),
                                    });
                                  }
                                }}
                                className="w-4 h-4"
                                disabled={templateRequestLoading}
                              />
                              <span className="text-sm">{t(`TEMPLATE${field === 'display_name' ? '64' : field === 'headline' ? '65' : field === 'bio' ? '66' : field === 'email' ? '67' : field === 'phone' ? '68' : field === 'location' ? '69' : field === 'avatar' ? '70' : '71'}`)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE72')}</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {['banner', 'background', 'logo', 'icon'].map((imageType) => (
                            <div key={imageType} className="space-y-2">
                              <Label className="text-sm">{t(`TEMPLATE${imageType === 'banner' ? '73' : imageType === 'background' ? '74' : imageType === 'logo' ? '75' : '76'}`)}</Label>
                              {uploadedImages[imageType] ? (
                                <div className="relative">
                                  <img src={uploadedImages[imageType]} alt={imageType} className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className={`absolute top-2 ${getPositionClass(locale, 'right-2', 'left-2')}`}
                                    onClick={() => {
                                      const newImages = { ...uploadedImages };
                                      delete newImages[imageType];
                                      setUploadedImages(newImages);
                                    }}
                                    disabled={uploadingImage !== null}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        await handleImageUpload(file, imageType);
                                      }
                                    }}
                                    disabled={templateRequestLoading || uploadingImage !== null}
                                  />
                                  {uploadingImage === imageType ? (
                                    <Loader2 className="h-6 w-6 text-muted-foreground mb-2 animate-spin" />
                                  ) : (
                                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                  )}
                                  <span className="text-xs text-muted-foreground">{t('TEMPLATE77')}</span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="color_scheme" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE15')}</Label>
                    <Input
                      id="color_scheme"
                      type="text"
                      value={templateFormData.color_scheme}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, color_scheme: e.target.value })}
                      placeholder={t('TEMPLATE16')}
                      disabled={templateRequestLoading}
                      dir={dir}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="layout_preference" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE17')}</Label>
                    <select
                      id="layout_preference"
                      value={templateFormData.layout_preference}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, layout_preference: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={templateRequestLoading}
                      dir={dir}
                    >
                      <option value="">{t('TEMPLATE18')}</option>
                      <option value="minimal">{t('TEMPLATE19')}</option>
                      <option value="modern">{t('TEMPLATE20')}</option>
                      <option value="classic">{t('TEMPLATE21')}</option>
                      <option value="creative">{t('TEMPLATE22')}</option>
                      <option value="professional">{t('TEMPLATE23')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="special_features" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE24')}</Label>
                    <Textarea
                      id="special_features"
                      value={templateFormData.special_features}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, special_features: e.target.value })}
                      placeholder={t('TEMPLATE25')}
                      rows={3}
                      disabled={templateRequestLoading}
                      dir={dir}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference_urls" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE26')}</Label>
                    <Input
                      id="reference_urls"
                      type="text"
                      value={templateFormData.reference_urls}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, reference_urls: e.target.value })}
                      placeholder={t('TEMPLATE27')}
                      disabled={templateRequestLoading}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional_notes" className={isRTL ? 'text-right' : 'text-left'}>{t('TEMPLATE28')}</Label>
                    <Textarea
                      id="additional_notes"
                      value={templateFormData.additional_notes}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, additional_notes: e.target.value })}
                      placeholder={t('TEMPLATE29')}
                      rows={3}
                      disabled={templateRequestLoading}
                      dir={dir}
                    />
                  </div>

                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      type="submit"
                      disabled={templateRequestLoading || !templateFormData.request_title.trim() || !templateFormData.description.trim()}
                      className="flex-1"
                    >
                      {templateRequestLoading ? (
                        <>
                          <Loader2 className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')} animate-spin`} />
                          {t('TEMPLATE30')}
                        </>
                      ) : (
                        t('TEMPLATE31')
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTemplateRequestForm(false);
                        setTemplateFormData({
                          request_title: '',
                          description: '',
                          data_source: 'use_existing',
                          required_fields: [],
                          color_scheme: '',
                          layout_preference: '',
                          special_features: '',
                          reference_urls: '',
                          additional_notes: '',
                          custom_data: {},
                        });
                        setUploadedImages({});
                        setTemplateRequestError(null);
                      }}
                      disabled={templateRequestLoading}
                    >
                      {t('TEMPLATE32')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Pending Template Requests */}
          {pendingTemplateRequests.length > 0 && (
            <Card>
              <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
                <CardTitle>{t('TEMPLATE33')}</CardTitle>
                <CardDescription>{t('TEMPLATE34')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTemplateRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="font-medium mb-1">{request.request_title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('TEMPLATE35')}: {formatDate(request.created_at)}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium flex-shrink-0">
                          {t('TEMPLATE36')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Branch Tracking Dashboard Request */}
      <Card id="branch-tracking-section">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <BarChart3 className="h-5 w-5" />
            {t('BRANCH_TRACKING_DASHBOARD')}
          </CardTitle>
          <CardDescription>
            {t('BRANCH_TRACKING_DASHBOARD_DESC')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branchTrackingRequestError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {branchTrackingRequestError}
            </div>
          )}

          {branchTrackingRequestSuccess && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              {t('BRANCH_TRACKING_REQUEST_SUCCESS')}
            </div>
          )}

          {branchTrackingRequestStatus === 'pending' && (
            <div className="p-4 bg-yellow-500/10 rounded-lg">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t('BRANCH_TRACKING_REQUEST_PENDING')}
                </p>
              </div>
            </div>
          )}

          {branchTrackingRequestStatus === 'approved' && (
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('BRANCH_TRACKING_REQUEST_APPROVED')}
                </p>
              </div>
            </div>
          )}

          {branchTrackingRequestStatus === 'rejected' && (
            <div className="p-4 bg-red-500/10 rounded-lg">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('BRANCH_TRACKING_REQUEST_REJECTED')}
                </p>
              </div>
            </div>
          )}

          {!branchTrackingRequestStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-semibold mb-1">
                    {t('BRANCH_TRACKING_DASHBOARD')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('BRANCH_TRACKING_DASHBOARD_DESC')}
                  </p>
                  <Button 
                    onClick={handleBranchTrackingRequestSubmit}
                    disabled={branchTrackingRequestLoading}
                  >
                    {branchTrackingRequestLoading ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('BRANCH_TRACKING_SUBMITTING')}
                      </>
                    ) : (
                      t('BRANCH_TRACKING_REQUEST_BUTTON')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Live Preview Section */}
        {showPreview && (
          <Card className="sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-hidden">
            <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
              <CardTitle>{t('DASH_PREVIEW') || 'Live Preview'}</CardTitle>
              <CardDescription>{t('DASH_PREVIEW_DESC') || 'See how your profile looks in real-time'}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-12rem)] w-full">
                <div className={`scale-75 ${isRTL ? 'origin-top-right' : 'origin-top-left'} w-[133.33%] h-[133.33%] overflow-x-hidden`} style={{ maxWidth: '100%' }}>
                  {mounted && getTemplatePreview()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

