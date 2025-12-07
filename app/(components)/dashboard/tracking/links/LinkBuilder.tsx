'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link as LinkIcon, QrCode, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';
import { getDirection } from '@/lib/utils/rtl';
import dynamic from 'next/dynamic';
import { RestaurantTemplate1 } from '@/app/(components)/tracking/restaurant-templates/RestaurantTemplate1';
import { MenuTemplate1 } from '@/app/(components)/tracking/menu-templates/MenuTemplate1';

const DEFAULT_RESTAURANT_COLORS = {
  primary: '#1d4ed8',
  accent: '#f97316',
  background: '#f8fafc',
  text: '#0f172a',
  heroOverlay: '#00000026',
} as const;

// Dynamically import QR code component
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { 
    ssr: false,
    loading: () => <div className="w-48 h-48 bg-muted animate-pulse rounded" />
  }
);

interface Business {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  business_id: string;
}

interface LinkBuilderProps {
  locale: string;
}

export function LinkBuilder({ locale }: LinkBuilderProps) {
  const searchParams = useSearchParams();
  const cardId = searchParams?.get('card_id');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ slug: string; url: string; id: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<null | 'cover_image' | 'logo' | 'menu_image'>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();
  const dir = getDirection(locale);

  // Form state
  const [formData, setFormData] = useState({
    business_id: '',
    branch_id: '',
    destination_type: 'google_maps_review' as 'google_maps_review' | 'restaurant_page' | 'menu_page' | 'custom_url',
    destination_url: '',
    selected_template: '',
    show_intermediate_page: true,
    collect_feedback_first: false,
    // Restaurant/Menu specific
    description: '',
    cover_image: '',
    logo: '',
    operating_hours: '',
    // Restaurant specific - Menu page link
    menu_page_url: '',
    show_map: false,
    // Social media links
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: '',
    // Menu specific
    menu_type: 'internal' as 'internal' | 'external',
    menu_items: [] as Array<{ name: string; description?: string; price?: string; image?: string }>,
    menu_image: '',
    external_menu_url: '',
    primary_color: '',
    accent_color: '',
    background_color: '',
    text_color: '',
    hero_overlay_color: '',
    page_background_image: '',
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (formData.business_id) {
      fetchBranches(formData.business_id);
    } else {
      setBranches([]);
    }
  }, [formData.business_id]);

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
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_LOAD_BRANCHES'),
        variant: 'destructive',
      });
    }
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (
    file: File,
    imageType: 'cover_image' | 'logo' | 'menu_image'
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('TRACKING_ERROR'),
        description: t('DASH46'),
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(imageType);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(t('TRACKING_ERROR'));
      }

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
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from('template-images').getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setFormData((prev) => ({
          ...prev,
          [imageType]: urlData.publicUrl,
        }));
        toast({
          title: t('TRACKING_SUCCESS'),
          description: t('TRACKING_IMAGE_UPLOADED'),
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({
        title: t('TRACKING_ERROR'),
        description: err?.message || t('DASH47'),
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const requireValidUrl = (value: string, label: string) => {
    if (!value) return undefined;
    if (!isValidUrl(value)) {
      throw new Error(t('TRACKING_ENTER_VALID_URL', { label }));
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.business_id || !formData.branch_id) {
        throw new Error(t('TRACKING_SELECT_BUSINESS_BRANCH'));
      }

      if (
        !formData.destination_url &&
        formData.destination_type !== 'restaurant_page' &&
        formData.destination_type !== 'menu_page'
      ) {
        throw new Error(t('TRACKING_ENTER_DESTINATION_URL'));
      }

      if (formData.destination_url && !isValidUrl(formData.destination_url)) {
        throw new Error(t('TRACKING_INVALID_DESTINATION_URL'));
      }

      const templatePayload: Record<string, unknown> = {};

      // Only add description if it's not empty after trim
      const description = formData.description?.trim();
      if (description && description.length > 0) {
        templatePayload.description = description;
      }

      // Only add operating_hours if it's not empty after trim
      const operatingHours = formData.operating_hours?.trim();
      if (operatingHours && operatingHours.length > 0) {
        templatePayload.operating_hours = operatingHours;
      }

      const coverImage = formData.cover_image?.trim();
      if (coverImage) {
        templatePayload.cover_image = requireValidUrl(
          coverImage,
          t('TRACKING_COVER_IMAGE_LABEL')
        );
      }

      const logo = formData.logo?.trim();
      if (logo) {
        templatePayload.logo = requireValidUrl(logo, t('TRACKING_LOGO_LABEL'));
      }

      const menuImage = formData.menu_image?.trim();
      if (menuImage) {
        templatePayload.menu_image = requireValidUrl(
          menuImage,
          t('TRACKING_MENU_IMAGE_LABEL')
        );
      }

      const colorFields: Array<keyof typeof formData> = [
        'primary_color',
        'accent_color',
        'background_color',
        'text_color',
        'hero_overlay_color',
      ];

      colorFields.forEach((field) => {
        const rawValue = formData[field];
        if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
          templatePayload[field] = rawValue.trim();
        }
      });

      const backgroundImageUrl = formData.page_background_image?.trim();
      if (backgroundImageUrl) {
        templatePayload.page_background_image = requireValidUrl(
          backgroundImageUrl,
          t('TRACKING_BACKGROUND_IMAGE_LABEL')
        );
      }

      // Handle menu page URL for restaurant pages
      if (formData.destination_type === 'restaurant_page') {
        const menuPageUrl = formData.menu_page_url?.trim();
        if (menuPageUrl) {
          // Check if it's a valid URL or a tracking link slug (6 alphanumeric chars)
          if (isValidUrl(menuPageUrl)) {
            templatePayload.menu_page_url = menuPageUrl;
          } else if (/^[a-z0-9]{6}$/i.test(menuPageUrl)) {
            // It's a tracking link slug, construct the full URL
            const siteUrl = typeof window !== 'undefined' 
              ? (window.location.origin.includes('localhost') 
                  ? 'https://vetaps.com' 
                  : window.location.origin)
              : 'https://vetaps.com';
            templatePayload.menu_page_url = `${siteUrl}/r/${menuPageUrl}`;
          } else {
            throw new Error(t('TRACKING_INVALID_MENU_PAGE_URL'));
          }
        }
        
        // Handle show map option
        if (formData.show_map) {
          templatePayload.show_map = true;
        }
        
        // Handle social media links
        const socialMediaLinks: Record<string, string> = {};
        const socialFields = [
          { key: 'facebook', value: formData.facebook_url },
          { key: 'instagram', value: formData.instagram_url },
          { key: 'twitter', value: formData.twitter_url },
          { key: 'linkedin', value: formData.linkedin_url },
          { key: 'youtube', value: formData.youtube_url },
          { key: 'tiktok', value: formData.tiktok_url },
        ];
        
        socialFields.forEach(({ key, value }) => {
          const trimmed = value?.trim();
          if (trimmed && isValidUrl(trimmed)) {
            socialMediaLinks[key] = trimmed;
          }
        });
        
        if (Object.keys(socialMediaLinks).length > 0) {
          templatePayload.social_media_links = socialMediaLinks;
        }
      }

      // Handle menu type (internal vs external)
      if (formData.destination_type === 'menu_page') {
        if (formData.menu_type === 'external') {
          const externalMenuUrl = formData.external_menu_url?.trim();
          if (!externalMenuUrl) {
            throw new Error(t('TRACKING_EXTERNAL_MENU_URL_REQUIRED'));
          }
          if (!isValidUrl(externalMenuUrl)) {
            throw new Error(t('TRACKING_INVALID_EXTERNAL_MENU_URL'));
          }
          templatePayload.external_menu_url = externalMenuUrl;
        } else {
          // Clean menu items - only include non-empty values
          const cleanedMenuItems = formData.menu_items
            .map((item, index) => {
              const name = item.name?.trim();
              if (!name || name.length === 0) {
                return null;
              }
              
              const cleaned: {
                name: string;
                description?: string;
                price?: string;
                image?: string;
              } = {
                name: name,
              };
              
              const itemDescription = item.description?.trim();
              if (itemDescription && itemDescription.length > 0) {
                cleaned.description = itemDescription;
              }
              
              const itemPrice = item.price?.trim();
              if (itemPrice && itemPrice.length > 0) {
                cleaned.price = itemPrice;
              }
              
              const itemImage = item.image?.trim();
              if (itemImage && itemImage.length > 0) {
                if (!isValidUrl(itemImage)) {
                  throw new Error(t('TRACKING_MENU_ITEM_IMAGE_INVALID', { num: index + 1 }));
                }
                cleaned.image = itemImage;
              }
              
              return cleaned;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (cleanedMenuItems.length > 0) {
            templatePayload.menu_items = cleanedMenuItems;
          }
        }
      }

      const shouldSendTemplateData = Object.keys(templatePayload).length > 0;

      const requestBody: Record<string, unknown> = {
        business_id: formData.business_id,
        branch_id: formData.branch_id,
        destination_type: formData.destination_type,
        destination_url:
          formData.destination_url || `https://vetaps.com/r/${formData.branch_id}`, // Fallback
        selected_template: formData.selected_template || null,
        show_intermediate_page: formData.show_intermediate_page,
        collect_feedback_first: formData.collect_feedback_first,
      };

      // Only include template_data if it has content
      if (shouldSendTemplateData) {
        requestBody.template_data = templatePayload;
      }

      // Log request body for debugging (remove in production)
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/tracking/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('TRACKING_FAILED_CREATE_LINK'));
      }

      // Get site URL from window or use current origin
      const siteUrl = typeof window !== 'undefined' 
        ? (window.location.origin.includes('localhost') 
            ? 'https://vetaps.com' 
            : window.location.origin)
        : 'https://vetaps.com';
      const fullUrl = `${siteUrl}/r/${result.slug}`;

      setCreatedLink({
        slug: result.slug,
        url: fullUrl,
        id: result.id,
      });

      // If card_id is provided, automatically link the card to this tracking link
      if (cardId && result.id) {
        try {
          const { error: linkError } = await supabase
            .from('nfc_cards')
            .update({ tracking_link_id: result.id })
            .eq('id', cardId);

          if (!linkError) {
            toast({
              title: t('TRACKING_SUCCESS'),
              description: t('TRACKING_CARD_LINKED_AUTO'),
            });
          }
        } catch (error) {
          console.error('Error linking card:', error);
        }
      }

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_LINK_CREATED_SUCCESS'),
      });

      // Reset form
      setFormData({
        ...formData,
        destination_url: '',
        selected_template: '',
        description: '',
        cover_image: '',
        logo: '',
        operating_hours: '',
        menu_page_url: '',
        show_map: false,
        facebook_url: '',
        instagram_url: '',
        twitter_url: '',
        linkedin_url: '',
        youtube_url: '',
        tiktok_url: '',
        menu_type: 'internal',
        menu_items: [],
        menu_image: '',
        external_menu_url: '',
        primary_color: '',
        accent_color: '',
        background_color: '',
        text_color: '',
        hero_overlay_color: '',
        page_background_image: '',
      });
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_CREATE_LINK'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
        <div className="mx-auto max-w-4xl w-full">
          {/* Header */}
          <div className="mb-8">
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {t('TRACKING_CREATE_LINK')}
              </h1>
              <p className="text-muted-foreground">
                {t('TRACKING_CREATE_UNIQUE_LINK')}
              </p>
            </div>
          </div>

          {/* Success Message */}
          {createdLink && (
            <Card className="mb-6 border-green-500 bg-green-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  {t('TRACKING_LINK_CREATED')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t('TRACKING_FINAL_URL')}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={createdLink.url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(createdLink.url);
                        toast({
                          title: t('TRACKING_COPIED'),
                          description: t('TRACKING_LINK_COPIED_TO_CLIPBOARD'),
                        });
                      }}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center p-4 bg-background rounded-lg">
                  {typeof window !== 'undefined' && (
                    <QRCodeSVG value={createdLink.url} size={200} />
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCreatedLink(null)}
                >
                  {t('TRACKING_CREATE_NEW')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          {!createdLink && (
            <Card>
              <CardHeader>
                <CardTitle>{t('TRACKING_LINK_INFO')}</CardTitle>
                <CardDescription>
                  {t('TRACKING_SELECT_BUSINESS_BRANCH_DEST')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Business Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="business_id">
                      {t('TRACKING_BUSINESS')} *
                    </Label>
                    <Select
                      value={formData.business_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, business_id: value, branch_id: '' });
                      }}
                      required
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

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="branch_id">
                      {t('TRACKING_BRANCH')} *
                    </Label>
                    <Select
                      value={formData.branch_id}
                      onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                      required
                      disabled={!formData.business_id || branches.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('TRACKING_SELECT_BRANCH')} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination Type */}
                  <div className="space-y-2">
                    <Label htmlFor="destination_type">
                      {t('TRACKING_DESTINATION_TYPE')} *
                    </Label>
                    <Select
                      value={formData.destination_type}
                      onValueChange={(value: any) => {
                        setFormData({ 
                          ...formData, 
                          destination_type: value,
                          selected_template: '',
                          destination_url: '',
                        });
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_maps_review">
                          {t('TRACKING_GOOGLE_MAPS_REVIEW')}
                        </SelectItem>
                        <SelectItem value="restaurant_page">
                          {t('TRACKING_RESTAURANT_PAGE')}
                        </SelectItem>
                        <SelectItem value="menu_page">
                          {t('TRACKING_MENU_PAGE')}
                        </SelectItem>
                        <SelectItem value="custom_url">
                          {t('TRACKING_CUSTOM_URL')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination URL (for Google Maps and Custom URL) */}
                  {(formData.destination_type === 'google_maps_review' || formData.destination_type === 'custom_url') && (
                    <div className="space-y-2">
                      <Label htmlFor="destination_url">
                        {t('TRACKING_DESTINATION_URL')} *
                      </Label>
                      <Input
                        id="destination_url"
                        type="url"
                        value={formData.destination_url}
                        onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                        required
                        placeholder={
                          formData.destination_type === 'google_maps_review'
                            ? 'https://maps.google.com/...'
                            : 'https://example.com'
                        }
                      />
                    </div>
                  )}

                  {/* Template Selection (for Restaurant and Menu) */}
                  {(formData.destination_type === 'restaurant_page' || formData.destination_type === 'menu_page') && (
                    <div className="space-y-3">
                      <Label htmlFor="selected_template">
                        {t('TRACKING_SELECT_TEMPLATE')} *
                      </Label>

                      {/* Hidden field to keep HTML validation happy */}
                      <input
                        id="selected_template"
                        type="hidden"
                        required
                        value={formData.selected_template || ''}
                      />

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isRestaurant = formData.destination_type === 'restaurant_page';
                          const value = `${isRestaurant ? 'restaurant' : 'menu'}-template-${num}`;
                          const selected = formData.selected_template === value;

                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  selected_template: value,
                                })
                              }
                              className={`group flex flex-col items-stretch rounded-lg border p-2 text-left transition-all ${
                                selected
                                  ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                                  : 'border-border hover:border-primary/60 hover:bg-muted/60'
                              }`}
                            >
                              {/* Mini visual preview */}
                              <div className="relative mb-2 h-20 w-full overflow-hidden rounded-md bg-gradient-to-br from-primary/10 to-muted/60">
                                <div className="absolute inset-0 flex flex-col justify-between p-1 text-[9px] leading-tight text-muted-foreground">
                                  <div className="flex items-center justify-between">
                                    <div className="h-3 w-10 rounded-sm bg-primary/40" />
                                    <div className="h-3 w-6 rounded-full bg-background/70 border border-primary/30" />
                                  </div>
                                  <div className="flex gap-1">
                                    <div className="flex-1 space-y-1">
                                      <div className="h-2 w-3/4 rounded-sm bg-background/70" />
                                      <div className="h-2 w-1/2 rounded-sm bg-background/40" />
                                      <div className="h-2 w-2/3 rounded-sm bg-background/40" />
                                    </div>
                                    <div className="h-10 w-10 rounded-md bg-background/80 border border-primary/30" />
                                  </div>
                                </div>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* Simple variation per template number for visual difference */}
                                  <div
                                    className={`h-full w-full ${
                                      isRestaurant
                                        ? ['bg-gradient-to-br from-amber-100 to-red-100',
                                           'bg-gradient-to-br from-emerald-100 to-teal-100',
                                           'bg-gradient-to-br from-sky-100 to-indigo-100',
                                           'bg-gradient-to-br from-rose-100 to-orange-100',
                                           'bg-gradient-to-br from-slate-100 to-zinc-100'][num - 1]
                                        : ['bg-gradient-to-br from-lime-100 to-emerald-100',
                                           'bg-gradient-to-br from-cyan-100 to-sky-100',
                                           'bg-gradient-to-br from-fuchsia-100 to-purple-100',
                                           'bg-gradient-to-br from-amber-100 to-yellow-100',
                                           'bg-gradient-to-br from-slate-100 to-blue-100'][num - 1]
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold">
                                  {t('TRACKING_TEMPLATE_NUM', { num })}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formData.destination_type === 'restaurant_page'
                                    ? t('TRACKING_RESTAURANT_TEMPLATE_LABEL', { num })
                                    : t('TRACKING_MENU_TEMPLATE_LABEL', { num })}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Restaurant/Menu Template Data + Live Preview */}
                  {(formData.destination_type === 'restaurant_page' || formData.destination_type === 'menu_page') && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h3 className="font-semibold">
                        {t('TRACKING_TEMPLATE_DATA')}
                      </h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">
                          {t('TRACKING_DESCRIPTION')}
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          placeholder={t('TRACKING_DESCRIPTION_PLACEHOLDER')}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cover_image">
                            {t('TRACKING_COVER_IMAGE')}
                          </Label>
                          <Input
                            id="cover_image"
                            type="url"
                            value={formData.cover_image}
                            onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                            placeholder="https://..."
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="block w-full text-xs text-muted-foreground file:text-xs file:px-2 file:py-1 file:mr-2 file:border file:border-input file:bg-background file:rounded-md"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleImageUpload(file, 'cover_image');
                                  e.target.value = '';
                                }
                              }}
                            />
                            {uploadingImage === 'cover_image' && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {t('TRACKING_UPLOAD_IMAGE_HELP')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo">
                            {t('TRACKING_LOGO')}
                          </Label>
                          <Input
                            id="logo"
                            type="url"
                            value={formData.logo}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            placeholder="https://..."
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="block w-full text-xs text-muted-foreground file:text-xs file:px-2 file:py-1 file:mr-2 file:border file:border-input file:bg-background file:rounded-md"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleImageUpload(file, 'logo');
                                  e.target.value = '';
                                }
                              }}
                            />
                            {uploadingImage === 'logo' && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {t('TRACKING_UPLOAD_IMAGE_HELP')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operating_hours">
                          {t('TRACKING_OPERATING_HOURS')}
                        </Label>
                        <Textarea
                          id="operating_hours"
                          value={formData.operating_hours}
                          onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                          rows={2}
                          placeholder={t('TRACKING_OPERATING_HOURS_PLACEHOLDER')}
                        />
                      </div>

                      {/* Restaurant specific - Menu Page Link */}
                      {formData.destination_type === 'restaurant_page' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="menu_page_url">
                              {t('TRACKING_MENU_PAGE_URL')}
                            </Label>
                            <Input
                              id="menu_page_url"
                              type="text"
                              value={formData.menu_page_url}
                              onChange={(e) =>
                                setFormData({ ...formData, menu_page_url: e.target.value })
                              }
                              placeholder={t('TRACKING_MENU_PAGE_URL_PLACEHOLDER')}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              {t('TRACKING_MENU_PAGE_URL_HELP')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_map"
                              checked={formData.show_map}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, show_map: checked === true })
                              }
                            />
                            <Label htmlFor="show_map" className="text-sm font-normal cursor-pointer">
                              {t('TRACKING_SHOW_MAP')}
                            </Label>
                          </div>
                          {formData.show_map && (
                            <p className="text-[11px] text-muted-foreground">
                              {t('TRACKING_SHOW_MAP_HELP')}
                            </p>
                          )}
                          
                          {/* Social Media Links */}
                          <div className="space-y-3 mt-4">
                            <Label className="text-sm font-semibold">
                              {t('TRACKING_SOCIAL_MEDIA_LINKS')}
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="facebook_url" className="text-xs">
                                  {t('TRACKING_FACEBOOK_URL')}
                                </Label>
                                <Input
                                  id="facebook_url"
                                  type="url"
                                  value={formData.facebook_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, facebook_url: e.target.value })
                                  }
                                  placeholder="https://facebook.com/..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="instagram_url" className="text-xs">
                                  {t('TRACKING_INSTAGRAM_URL')}
                                </Label>
                                <Input
                                  id="instagram_url"
                                  type="url"
                                  value={formData.instagram_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, instagram_url: e.target.value })
                                  }
                                  placeholder="https://instagram.com/..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="twitter_url" className="text-xs">
                                  {t('TRACKING_TWITTER_URL')}
                                </Label>
                                <Input
                                  id="twitter_url"
                                  type="url"
                                  value={formData.twitter_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, twitter_url: e.target.value })
                                  }
                                  placeholder="https://twitter.com/..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="linkedin_url" className="text-xs">
                                  {t('TRACKING_LINKEDIN_URL')}
                                </Label>
                                <Input
                                  id="linkedin_url"
                                  type="url"
                                  value={formData.linkedin_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, linkedin_url: e.target.value })
                                  }
                                  placeholder="https://linkedin.com/..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="youtube_url" className="text-xs">
                                  {t('TRACKING_YOUTUBE_URL')}
                                </Label>
                                <Input
                                  id="youtube_url"
                                  type="url"
                                  value={formData.youtube_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, youtube_url: e.target.value })
                                  }
                                  placeholder="https://youtube.com/..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="tiktok_url" className="text-xs">
                                  {t('TRACKING_TIKTOK_URL')}
                                </Label>
                                <Input
                                  id="tiktok_url"
                                  type="url"
                                  value={formData.tiktok_url}
                                  onChange={(e) =>
                                    setFormData({ ...formData, tiktok_url: e.target.value })
                                  }
                                  placeholder="https://tiktok.com/..."
                                />
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {t('TRACKING_SOCIAL_MEDIA_LINKS_HELP')}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Menu specific fields */}
                      {formData.destination_type === 'menu_page' && (
                        <>
                          {/* Menu Type Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="menu_type">
                              {t('TRACKING_MENU_TYPE')} *
                            </Label>
                            <Select
                              value={formData.menu_type}
                              onValueChange={(value: 'internal' | 'external') => {
                                setFormData({
                                  ...formData,
                                  menu_type: value,
                                  menu_items: value === 'external' ? [] : formData.menu_items,
                                  external_menu_url: value === 'internal' ? '' : formData.external_menu_url,
                                });
                              }}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">
                                  {t('TRACKING_MENU_TYPE_INTERNAL')}
                                </SelectItem>
                                <SelectItem value="external">
                                  {t('TRACKING_MENU_TYPE_EXTERNAL')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                              {formData.menu_type === 'internal'
                                ? t('TRACKING_MENU_TYPE_INTERNAL_DESC')
                                : t('TRACKING_MENU_TYPE_EXTERNAL_DESC')}
                            </p>
                          </div>

                          {/* External Menu URL */}
                          {formData.menu_type === 'external' && (
                            <div className="space-y-2">
                              <Label htmlFor="external_menu_url">
                                {t('TRACKING_EXTERNAL_MENU_URL')} *
                              </Label>
                              <Input
                                id="external_menu_url"
                                type="url"
                                value={formData.external_menu_url}
                                onChange={(e) =>
                                  setFormData({ ...formData, external_menu_url: e.target.value })
                                }
                                placeholder="https://example.com/menu"
                                required
                              />
                              <p className="text-[11px] text-muted-foreground">
                                {t('TRACKING_EXTERNAL_MENU_URL_HELP')}
                              </p>
                            </div>
                          )}

                          {/* Internal Menu Fields */}
                          {formData.menu_type === 'internal' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="menu_image">
                                  {t('TRACKING_MENU_IMAGE')}
                                </Label>
                                <Input
                                  id="menu_image"
                                  type="url"
                                  value={formData.menu_image}
                                  onChange={(e) => setFormData({ ...formData, menu_image: e.target.value })}
                                  placeholder="https://..."
                                />
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-xs text-muted-foreground file:text-xs file:px-2 file:py-1 file:mr-2 file:border file:border-input file:bg-background file:rounded-md"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        void handleImageUpload(file, 'menu_image');
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                  {uploadingImage === 'menu_image' && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  {t('TRACKING_UPLOAD_IMAGE_HELP')}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t('TRACKING_ADD_MENU_ITEMS_LATER')}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* Live Template Preview */}
                      {formData.selected_template && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('TRACKING_TEMPLATE_PREVIEW')}
                          </p>
                          <div className="rounded-xl border bg-background overflow-hidden">
                            <div className="max-h-[520px] overflow-y-auto">
                              {formData.destination_type === 'restaurant_page' && (
                                <RestaurantTemplate1
                                  businessName={
                                    businesses.find((b) => b.id === formData.business_id)?.name ||
                                    'Business Name'
                                  }
                                  branchName={
                                    branches.find((br) => br.id === formData.branch_id)?.name || undefined
                                  }
                                  logo={formData.logo || undefined}
                                  coverImage={formData.cover_image || undefined}
                                  address={undefined}
                                  googleMapsUrl={undefined}
                                  operatingHours={formData.operating_hours || undefined}
                                  description={formData.description || undefined}
                                  destinationUrl="#"
                                  onContinue={() => {}}
                                  templateVariant={Number(formData.selected_template.match(/(\d+)/)?.[1] || '1')}
                                  primaryColor={formData.primary_color || undefined}
                                  accentColor={formData.accent_color || undefined}
                                  backgroundColor={formData.background_color || undefined}
                                  textColor={formData.text_color || undefined}
                                  heroOverlayColor={formData.hero_overlay_color || undefined}
                                  pageBackgroundImage={formData.page_background_image || undefined}
                                  menuPageUrl={formData.menu_page_url || undefined}
                                  showMap={formData.show_map}
                                  socialMediaLinks={{
                                    facebook: formData.facebook_url || undefined,
                                    instagram: formData.instagram_url || undefined,
                                    twitter: formData.twitter_url || undefined,
                                    linkedin: formData.linkedin_url || undefined,
                                    youtube: formData.youtube_url || undefined,
                                    tiktok: formData.tiktok_url || undefined,
                                  }}
                                />
                              )}

                              {formData.destination_type === 'menu_page' && (
                                <MenuTemplate1
                                  businessName={
                                    businesses.find((b) => b.id === formData.business_id)?.name ||
                                    'Business Name'
                                  }
                                  branchName={
                                    branches.find((br) => br.id === formData.branch_id)?.name || undefined
                                  }
                                  logo={formData.logo || undefined}
                                  coverImage={formData.cover_image || undefined}
                                  address={undefined}
                                  googleMapsUrl={undefined}
                                  operatingHours={formData.operating_hours || undefined}
                                  menuImage={formData.menu_type === 'internal' ? (formData.menu_image || undefined) : undefined}
                                  menuItems={formData.menu_type === 'internal' ? (formData.menu_items.length > 0 ? formData.menu_items : undefined) : undefined}
                                  externalMenuUrl={formData.menu_type === 'external' ? (formData.external_menu_url || undefined) : undefined}
                                  description={formData.description || undefined}
                                  destinationUrl="#"
                                  onContinue={() => {}}
                                  templateVariant={Number(formData.selected_template.match(/(\d+)/)?.[1] || '1')}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.destination_type === 'restaurant_page' && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          {t('TRACKING_THEME_CUSTOMIZATION')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t('TRACKING_THEME_CUSTOMIZATION_DESC')}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>{t('TRACKING_PRIMARY_COLOR')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.primary_color || DEFAULT_RESTAURANT_COLORS.primary}
                              onChange={(e) =>
                                setFormData({ ...formData, primary_color: e.target.value })
                              }
                              className="h-10 w-16 rounded-md border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, primary_color: '' })}
                            >
                              {t('TRACKING_COLOR_RESET')}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('TRACKING_ACCENT_COLOR')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.accent_color || DEFAULT_RESTAURANT_COLORS.accent}
                              onChange={(e) =>
                                setFormData({ ...formData, accent_color: e.target.value })
                              }
                              className="h-10 w-16 rounded-md border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, accent_color: '' })}
                            >
                              {t('TRACKING_COLOR_RESET')}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('TRACKING_BACKGROUND_COLOR')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.background_color || DEFAULT_RESTAURANT_COLORS.background}
                              onChange={(e) =>
                                setFormData({ ...formData, background_color: e.target.value })
                              }
                              className="h-10 w-16 rounded-md border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, background_color: '' })}
                            >
                              {t('TRACKING_COLOR_RESET')}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('TRACKING_TEXT_COLOR')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.text_color || DEFAULT_RESTAURANT_COLORS.text}
                              onChange={(e) =>
                                setFormData({ ...formData, text_color: e.target.value })
                              }
                              className="h-10 w-16 rounded-md border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, text_color: '' })}
                            >
                              {t('TRACKING_COLOR_RESET')}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('TRACKING_HERO_OVERLAY_COLOR')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.hero_overlay_color || DEFAULT_RESTAURANT_COLORS.heroOverlay}
                              onChange={(e) =>
                                setFormData({ ...formData, hero_overlay_color: e.target.value })
                              }
                              className="h-10 w-16 rounded-md border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, hero_overlay_color: '' })}
                            >
                              {t('TRACKING_COLOR_RESET')}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="background_image">
                          {t('TRACKING_BACKGROUND_IMAGE')}
                        </Label>
                        <Input
                          id="background_image"
                          type="url"
                          value={formData.page_background_image}
                          onChange={(e) =>
                            setFormData({ ...formData, page_background_image: e.target.value })
                          }
                          placeholder="https://example.com/wallpaper.jpg"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('TRACKING_BACKGROUND_IMAGE_HELP')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">
                      {t('TRACKING_ADDITIONAL_OPTIONS')}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show_intermediate_page"
                        checked={formData.show_intermediate_page}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, show_intermediate_page: checked as boolean });
                        }}
                      />
                      <Label 
                        htmlFor="show_intermediate_page"
                        className="text-sm font-normal cursor-pointer"
                      >
                        {t('TRACKING_SHOW_INTERMEDIATE_PAGE')}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="collect_feedback_first"
                        checked={formData.collect_feedback_first}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, collect_feedback_first: checked as boolean });
                        }}
                      />
                      <Label 
                        htmlFor="collect_feedback_first"
                        className="text-sm font-normal cursor-pointer"
                      >
                        {t('TRACKING_COLLECT_FEEDBACK_FIRST')}
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={submitting} size="lg">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('TRACKING_CREATING')}
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          {t('TRACKING_CREATE_LINK')}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

