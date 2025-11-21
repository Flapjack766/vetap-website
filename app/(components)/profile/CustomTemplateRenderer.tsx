'use client';

import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface CustomTemplateRendererProps {
  templateCode: string;
  profile: any;
  locale: string;
}

export function CustomTemplateRenderer({ templateCode, profile, locale }: CustomTemplateRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !templateCode) return;

    // Clear container
    containerRef.current.innerHTML = '';
    setError(null);

    try {
      // استبدال المتغيرات في الكود ببيانات المستخدم الفعلية
      let processedCode = templateCode;
      
      // استبدال بيانات البروفايل
      processedCode = processedCode.replace(/\{\{profile\.display_name\}\}/g, profile.display_name || '');
      processedCode = processedCode.replace(/\{\{profile\.headline\}\}/g, profile.headline || '');
      processedCode = processedCode.replace(/\{\{profile\.bio\}\}/g, profile.bio || '');
      processedCode = processedCode.replace(/\{\{profile\.email\}\}/g, profile.email || '');
      processedCode = processedCode.replace(/\{\{profile\.phone\}\}/g, profile.phone || '');
      processedCode = processedCode.replace(/\{\{profile\.location\}\}/g, profile.location || '');
      processedCode = processedCode.replace(/\{\{profile\.avatar_url\}\}/g, profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || 'User')}&size=128&background=random`);
      
      // استبدال روابط التواصل الاجتماعي
      if (profile.links) {
        processedCode = processedCode.replace(/\{\{profile\.links\.whatsapp\}\}/g, profile.links.whatsapp || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.instagram\}\}/g, profile.links.instagram || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.twitter\}\}/g, profile.links.twitter || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.linkedin\}\}/g, profile.links.linkedin || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.snapchat\}\}/g, profile.links.snapchat || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.tiktok\}\}/g, profile.links.tiktok || '#');
        processedCode = processedCode.replace(/\{\{profile\.links\.website\}\}/g, profile.links.website || '#');
      }

      // استبدال الصور المرفوعة من الطلب
      // Note: uploaded_images يتم تمريرها من custom_template إذا كانت موجودة
      if (profile.uploaded_images) {
        Object.entries(profile.uploaded_images).forEach(([key, url]) => {
          const urlString = typeof url === 'string' ? url : '';
          processedCode = processedCode.replace(new RegExp(`\\{\\{uploaded_images\\.${key}\\}\\}`, 'g'), urlString);
          processedCode = processedCode.replace(new RegExp(`\\{\\{images\\.${key}\\}\\}`, 'g'), urlString);
        });
      }

      // تنظيف الكود من أي عناصر خطرة (XSS Protection)
      const sanitizedCode = DOMPurify.sanitize(processedCode, {
        ALLOWED_TAGS: [
          'div', 'section', 'article', 'header', 'footer', 'main', 'nav',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'span', 'strong', 'em', 'b', 'i', 'u',
          'a', 'img', 'button', 'input', 'textarea', 'select', 'option',
          'ul', 'ol', 'li', 'dl', 'dt', 'dd',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'br', 'hr', 'blockquote', 'pre', 'code',
          'form', 'label', 'fieldset', 'legend', 'svg', 'path'
        ],
        ALLOWED_ATTR: [
          'class', 'id', 'href', 'src', 'alt', 'title', 'target', 'rel',
          'type', 'value', 'placeholder', 'disabled', 'readonly',
          'style', 'data-*', 'aria-*', 'role', 'fill', 'stroke',
          'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'viewBox',
          'onerror', 'd'
        ],
        ALLOW_DATA_ATTR: true,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: false,
      });

      // إنشاء wrapper div للقالب
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-template-wrapper min-h-screen';
      wrapper.innerHTML = sanitizedCode;
      
      containerRef.current.appendChild(wrapper);
    } catch (error: any) {
      console.error('Error rendering custom template:', error);
      setError(error.message || 'Error loading custom template');
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="min-h-screen flex items-center justify-center p-8">
            <div class="text-center">
              <div class="text-destructive mb-2 font-semibold">Error loading custom template</div>
              <div class="text-sm text-muted-foreground">${error.message || 'Please contact support'}</div>
            </div>
          </div>
        `;
      }
    }
  }, [templateCode, profile, locale]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-destructive mb-2 font-semibold">Error loading custom template</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="custom-template-container">
      {/* Template will be rendered here safely */}
    </div>
  );
}

