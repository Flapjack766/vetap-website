'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Template1Profile } from './templates/Template1Profile';
import { Template2Profile } from './templates/Template2Profile';
import { Template3Profile } from './templates/Template3Profile';
import { Template4Profile } from './templates/Template4Profile';
import { Template5Profile } from './templates/Template5Profile';
import { AnalyticsTracker } from './AnalyticsTracker';
import { CustomTemplateRenderer } from './CustomTemplateRenderer';

interface Profile {
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
  template_id: number;
  username_random: string;
  username_custom: string | null;
}

interface PublicProfileProps {
  profile: Profile;
  locale: string;
}

export function PublicProfile({ profile, locale }: PublicProfileProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [loadingCustom, setLoadingCustom] = useState(true);
  
  // Select template based on template_id
  const templateId = profile.template_id || 1;

  // Fetch custom template if template_id is 999 (custom)
  useEffect(() => {
    if (templateId === 999) {
      const fetchCustomTemplate = async () => {
        try {
          // جلب القالب المخصص المحدد (من custom_template_id) أو أحدث قالب
          let templateData;
          
          if (profile.custom_template_id) {
            // جلب القالب المحدد
            const { data, error } = await supabase
              .from('custom_templates')
              .select('*, custom_template_requests(uploaded_images)')
              .eq('id', profile.custom_template_id)
              .eq('is_deleted', false)
              .maybeSingle();
            
            if (!error && data) {
              templateData = data;
            }
          }
          
          // إذا لم يتم العثور على القالب المحدد، جلب أحدث قالب
          if (!templateData) {
            const { data, error } = await supabase
              .from('custom_templates')
              .select('*, custom_template_requests(uploaded_images)')
              .eq('profile_id', profile.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (!error && data) {
              templateData = data;
            }
          }

          if (templateData) {
            // دمج الصور المرفوعة من الطلب مع بيانات القالب
            const templateWithImages = {
              ...templateData,
              uploaded_images: templateData.custom_template_requests?.[0]?.uploaded_images || {},
            };
            setCustomTemplate(templateWithImages);
          }
        } catch (err) {
          console.error('Error fetching custom template:', err);
        } finally {
          setLoadingCustom(false);
        }
      };

      fetchCustomTemplate();
    } else {
      setLoadingCustom(false);
    }
  }, [templateId, profile.id, profile.custom_template_id]);

  const templateComponent = (() => {
    // If custom template is selected and loaded
    if (templateId === 999 && customTemplate && !loadingCustom) {
      // دمج الصور المرفوعة مع بيانات البروفايل
      const profileWithImages = {
        ...profile,
        uploaded_images: customTemplate.uploaded_images || {},
      };
      return <CustomTemplateRenderer templateCode={customTemplate.template_code} profile={profileWithImages} locale={locale} />;
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
  })();

  if (templateId === 999 && loadingCustom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnalyticsTracker profileId={profile.id} pagePath={pathname} />
      {templateComponent}
    </>
  );
}

