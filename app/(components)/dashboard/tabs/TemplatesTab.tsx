'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Palette } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getPositionClass, getDirection } from '@/lib/utils/rtl';

// Dynamically import template components for live preview
const Template1Profile = dynamic(() => import('@/app/(components)/profile/templates/Template1Profile').then(mod => ({ default: mod.Template1Profile })), { ssr: false });
const Template2Profile = dynamic(() => import('@/app/(components)/profile/templates/Template2Profile').then(mod => ({ default: mod.Template2Profile })), { ssr: false });
const Template3Profile = dynamic(() => import('@/app/(components)/profile/templates/Template3Profile').then(mod => ({ default: mod.Template3Profile })), { ssr: false });
const Template4Profile = dynamic(() => import('@/app/(components)/profile/templates/Template4Profile').then(mod => ({ default: mod.Template4Profile })), { ssr: false });
const Template5Profile = dynamic(() => import('@/app/(components)/profile/templates/Template5Profile').then(mod => ({ default: mod.Template5Profile })), { ssr: false });
const CustomTemplateRenderer = dynamic(() => import('@/app/(components)/profile/CustomTemplateRenderer').then(mod => ({ default: mod.CustomTemplateRenderer })), { ssr: false });

interface TemplatesTabProps {
  profile: any;
  locale: string;
  onUpdate: (profile: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const templates = [
  {
    id: 1,
    name: 'Classic',
    description: 'Traditional card layout with header and sections',
    preview: '/images/template-1-preview.png', // Placeholder
  },
  {
    id: 2,
    name: 'Minimal',
    description: 'Clean and simple design',
    preview: '/images/template-2-preview.png', // Placeholder
  },
  {
    id: 3,
    name: 'Card',
    description: 'Compact card-based layout',
    preview: '/images/template-3-preview.png', // Placeholder
  },
  {
    id: 4,
    name: 'Sections',
    description: 'Organized sections layout',
    preview: '/images/template-4-preview.png', // Placeholder
  },
  {
    id: 5,
    name: 'Hero',
    description: 'Full-screen hero layout',
    preview: '/images/template-5-preview.png', // Placeholder
  },
];

export function TemplatesTab({ profile, locale, onUpdate, onNext, onPrevious, onNavigateToTab }: TemplatesTabProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);

  const [selectedTemplate, setSelectedTemplate] = useState<number>(profile.template_id || 1);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(
    profile.custom_template_id || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<number | string | null>(null);
  const [clickedTemplate, setClickedTemplate] = useState<number | string | null>(null);
  const [customTemplateData, setCustomTemplateData] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update selected template when profile changes (when switching between profiles)
  useEffect(() => {
    setSelectedTemplate(profile.template_id || 1);
    setSelectedCustomTemplateId(profile.custom_template_id || null);
    setError(null);
    setSuccess(false);
  }, [profile.id, profile.template_id, profile.custom_template_id]);

  // Fetch all custom templates (not just one)
  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        // Get ALL custom templates for this profile (not deleted) with uploaded images
        const { data, error } = await supabase
          .from('custom_templates')
          .select('*, custom_template_requests(uploaded_images)')
          .eq('profile_id', profile.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setCustomTemplates(data);
          // Store custom template data for preview
          const templateDataMap: Record<string, any> = {};
          data.forEach((template: any) => {
            templateDataMap[template.id] = template;
          });
          setCustomTemplateData(templateDataMap);
          // If profile has custom_template_id, set it
          if (profile.custom_template_id) {
            setSelectedCustomTemplateId(profile.custom_template_id);
          }
        }
      } catch (err) {
        console.error('Error fetching custom templates:', err);
      }
    };

    fetchCustomTemplates();
  }, [profile.id, profile.custom_template_id]);

  const handleTemplateSelect = async (templateId: number | string) => {
    // templateId can be a number (1-5) or a string (custom template UUID)
    const isCustomTemplate = typeof templateId === 'string';
    const isStandardTemplate = typeof templateId === 'number' && templateId >= 1 && templateId <= 5;
    
    if (!isCustomTemplate && !isStandardTemplate) return;
    
    // Check if already selected
    if (isCustomTemplate && selectedTemplate === 999 && selectedCustomTemplateId === templateId) return;
    if (isStandardTemplate && selectedTemplate === templateId && selectedCustomTemplateId === null) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('DASH7'));
        setLoading(false);
        return;
      }

      // Update profile
      const updateData: any = {};
      
      if (isCustomTemplate) {
        // Selecting a custom template
        updateData.template_id = 999;
        updateData.custom_template_id = templateId;
      } else {
        // Selecting a standard template
        updateData.template_id = templateId;
        updateData.custom_template_id = null;
      }
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
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
          return;
        }
        // If error is empty object, continue to check if update actually worked
      }

      if (!updatedProfile) {
        // Try to fetch profile to see if update actually worked
        const { data: checkProfile } = await supabase
          .from('profiles')
          .select('template_id, custom_template_id')
          .eq('id', profile.id) // Use profile.id instead of user_id
          .eq('user_id', user.id) // Also verify user_id for security
          .maybeSingle();
        
        if (checkProfile && 
            ((isCustomTemplate && checkProfile.template_id === 999 && checkProfile.custom_template_id === templateId) ||
             (isStandardTemplate && checkProfile.template_id === templateId))) {
          // Update worked, just couldn't return data - use current profile with new template_id
          const updated = { 
            ...profile, 
            template_id: isCustomTemplate ? 999 : templateId,
            custom_template_id: isCustomTemplate ? templateId : null
          };
          setSelectedTemplate(isCustomTemplate ? 999 : templateId);
          setSelectedCustomTemplateId(isCustomTemplate ? templateId : null);
          setSuccess(true);
          onUpdate(updated);
          setTimeout(() => setSuccess(false), 3000);
          router.refresh();
          return;
        }
        
        setError(t('DASH8'));
        setLoading(false);
        return;
      }

      setSelectedTemplate(isCustomTemplate ? 999 : templateId);
      setSelectedCustomTemplateId(isCustomTemplate ? templateId : null);
      setSuccess(true);
      onUpdate(updatedProfile);
      router.refresh();
      
      // Show success message and navigate to link tab after 2 seconds
      if (onNext) {
        setTimeout(() => {
          onNext();
        }, 2000);
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(t('DASH8'));
    } finally {
      setLoading(false);
    }
  };

  // Get template preview component
  const getTemplatePreview = (templateId: number | string, customTemplate?: any) => {
    const previewProfile = {
      ...profile,
      template_id: typeof templateId === 'number' ? templateId : 999,
      custom_template_id: typeof templateId === 'string' ? templateId : null,
    };

    if (typeof templateId === 'string') {
      // Custom template
      const template = customTemplate || customTemplateData[templateId];
      if (template) {
        const profileWithImages = {
          ...previewProfile,
          uploaded_images: template.uploaded_images || template.custom_template_requests?.[0]?.uploaded_images || {},
        };
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
            <CustomTemplateRenderer templateCode={template.template_code} profile={profileWithImages} locale={locale} />
          </div>
        );
      }
      return null;
    }

    // Standard templates
    switch (templateId) {
      case 1:
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
            <Template1Profile profile={previewProfile} locale={locale} />
          </div>
        );
      case 2:
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none" style={{ marginTop: '-6rem' }}>
            <Template2Profile profile={previewProfile} locale={locale} />
          </div>
        );
      case 3:
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
            <Template3Profile profile={previewProfile} locale={locale} />
          </div>
        );
      case 4:
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
            <Template4Profile profile={previewProfile} locale={locale} />
          </div>
        );
      case 5:
        return (
          <div className="scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
            <Template5Profile profile={previewProfile} locale={locale} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card dir="ltr">
      <CardHeader>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <CardTitle>{t('DASH5')}</CardTitle>
            <CardDescription>{t('DASH26')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('link');
              }
            }}
            className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Palette className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('DASH72')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 mb-6 space-y-3">
            <div className="font-medium">{t('NAV_SUCCESS')}</div>
            {onNext && (
              <div className="text-xs opacity-80">
                {t('NAV_VIEW_LINK')}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Custom Templates - Show ALL custom templates */}
          {customTemplates.map((customTemplate) => {
            const isSelected = selectedTemplate === 999 && selectedCustomTemplateId === customTemplate.id;
            return (
              <div
                key={customTemplate.id}
                className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary shadow-lg'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={(e) => {
                  // On mobile: toggle preview on click
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    e.stopPropagation();
                    setClickedTemplate(clickedTemplate === customTemplate.id ? null : customTemplate.id);
                  } else {
                    // On desktop: select template
                    if (!loading) {
                      handleTemplateSelect(customTemplate.id);
                    }
                  }
                }}
                onMouseEnter={() => setHoveredTemplate(customTemplate.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                  <div className={`absolute top-2 ${getPositionClass(locale, 'right-2', 'left-2')} z-10`}>
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  {mounted && (hoveredTemplate === customTemplate.id || clickedTemplate === customTemplate.id) ? (
                    <div className="w-full h-full overflow-hidden">
                      {getTemplatePreview(customTemplate.id, customTemplate)}
                    </div>
                  ) : (
                  <div className="text-center p-4">
                    <div className="text-4xl font-bold mb-2">Custom</div>
                    <div className="text-sm text-muted-foreground">{customTemplate.template_name}</div>
                      {typeof window !== 'undefined' && window.innerWidth < 1024 && (
                        <div className="text-xs text-muted-foreground mt-2">{t('TEMPLATE_TAP_PREVIEW')}</div>
                      )}
                  </div>
                  )}
                </div>

                <div className="p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {customTemplate.template_name}
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{t('TEMPLATE59')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(customTemplate.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="w-full mt-2"
                    disabled={loading || isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateSelect(customTemplate.id);
                      // Close preview on mobile after selection
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setClickedTemplate(null);
                      }
                    }}
                  >
                    {isSelected ? t('DASH27') : t('DASH28')}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Standard Templates */}
          {templates.map((template) => (
            <div
              key={template.id}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={(e) => {
                // On mobile: toggle preview on click
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  e.stopPropagation();
                  setClickedTemplate(clickedTemplate === template.id ? null : template.id);
                } else {
                  // On desktop: select template
                  if (!loading) {
                    handleTemplateSelect(template.id);
                  }
                }
              }}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Live Preview */}
              <div className={`aspect-video bg-muted flex overflow-hidden ${template.id === 2 ? 'items-start justify-center' : 'items-center justify-center'}`}>
                {mounted && (hoveredTemplate === template.id || clickedTemplate === template.id) ? (
                  <div className="w-full h-full overflow-hidden">
                    {getTemplatePreview(template.id)}
                  </div>
                ) : (
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">Template {template.id}</div>
                  <div className="text-sm text-muted-foreground">{template.name}</div>
                    {typeof window !== 'undefined' && window.innerWidth < 1024 && (
                      <div className="text-xs text-muted-foreground mt-2">{t('TEMPLATE_TAP_PREVIEW')}</div>
                    )}
                </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4 bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  size="sm"
                  className="w-full mt-2"
                  disabled={loading || selectedTemplate === template.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template.id);
                    // Close preview on mobile after selection
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setClickedTemplate(null);
                    }
                  }}
                >
                  {selectedTemplate === template.id ? t('DASH27') : t('DASH28')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {mounted && (onPrevious || onNext) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
            {onNext && (
              <Button
                type="button"
                variant="default"
                disabled={loading || !selectedTemplate}
                onClick={() => {
                  if (onNext) {
                    onNext();
                  }
                }}
                className={onPrevious ? "flex-1" : "w-full"}
              >
                {t('NAV_VIEW_LINK')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

