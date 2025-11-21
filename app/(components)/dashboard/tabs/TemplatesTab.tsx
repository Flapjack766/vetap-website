'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TemplatesTabProps {
  profile: any;
  locale: string;
  onUpdate: (profile: any) => void;
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

export function TemplatesTab({ profile, locale, onUpdate }: TemplatesTabProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();

  const [selectedTemplate, setSelectedTemplate] = useState<number>(profile.template_id || 1);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(
    profile.custom_template_id || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);

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
        // Get ALL custom templates for this profile (not deleted)
        const { data, error } = await supabase
          .from('custom_templates')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setCustomTemplates(data);
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
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setError(t('DASH8'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('DASH5')}</CardTitle>
        <CardDescription>{t('DASH26')}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 mb-6">
            {t('DASH10')}
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
                onClick={() => !loading && handleTemplateSelect(customTemplate.id)}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <div className="absolute top-2 right-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="text-center p-4">
                    <div className="text-4xl font-bold mb-2">Custom</div>
                    <div className="text-sm text-muted-foreground">{customTemplate.template_name}</div>
                  </div>
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
              onClick={() => !loading && handleTemplateSelect(template.id)}
            >
              {/* Preview Placeholder */}
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">Template {template.id}</div>
                  <div className="text-sm text-muted-foreground">{template.name}</div>
                </div>
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
                  }}
                >
                  {selectedTemplate === template.id ? t('DASH27') : t('DASH28')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

