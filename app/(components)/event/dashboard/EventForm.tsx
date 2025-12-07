'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Calendar, 
  MapPin, 
  FileImage, 
  Upload, 
  Save,
  ArrowLeft,
  Loader2,
  X,
  Image as ImageIcon,
  FileText,
  Settings,
  QrCode,
  Hash,
  Users,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import { QRPositionEditor } from './QRPositionEditor';
import type { Event, Template, EventStatus } from '@/lib/event/types';

interface EventFormProps {
  locale: string;
  eventId?: string;
}

interface FormData {
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  venue: string;
  status: EventStatus;
  template_id: string;
  max_guests: number | null;
  pass_max_uses: number;
}

interface QRPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const DEFAULT_QR_POSITION: QRPosition = {
  x: 50,
  y: 70,
  width: 15,
  height: 15,
  rotation: 0,
};

export function EventForm({ locale, eventId }: EventFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const isEditMode = !!eventId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customTemplateFile, setCustomTemplateFile] = useState<File | null>(null);
  const [customTemplatePreview, setCustomTemplatePreview] = useState<string | null>(null);
  const [customTemplateType, setCustomTemplateType] = useState<'image' | 'pdf'>('image');
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [showQREditor, setShowQREditor] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    starts_at: '',
    ends_at: '',
    venue: '',
    status: 'draft',
    template_id: '',
    max_guests: null,
    pass_max_uses: 1,
  });

  const [qrPosition, setQrPosition] = useState<QRPosition>(DEFAULT_QR_POSITION);
  const [qrPositionSaved, setQrPositionSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const templatesResponse = await fetch('/api/event/templates', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const templatesData = await templatesResponse.json();
      if (templatesData.templates) {
        setTemplates(templatesData.templates);
      }

      if (eventId) {
        const eventResponse = await fetch(`/api/event/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const eventData = await eventResponse.json();
        
        if (eventData.event) {
          const event = eventData.event;
          setFormData({
            name: event.name || '',
            description: event.description || '',
            starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '',
            ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
            venue: event.venue || '',
            status: event.status || 'draft',
            template_id: event.template_id || '',
            max_guests: event.max_guests || null,
            pass_max_uses: event.pass_max_uses || 1,
          });

          if (event.qr_position) {
            setQrPosition(event.qr_position);
            setQrPositionSaved(true);
          } else if (event.template) {
            setQrPosition({
              x: event.template.qr_position_x || DEFAULT_QR_POSITION.x,
              y: event.template.qr_position_y || DEFAULT_QR_POSITION.y,
              width: event.template.qr_width || DEFAULT_QR_POSITION.width,
              height: event.template.qr_height || DEFAULT_QR_POSITION.height,
              rotation: 0,
            });
            setQrPositionSaved(true);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = value === '' ? null : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({ ...prev, template_id: templateId }));
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setQrPosition({
        x: template.qr_position_x || DEFAULT_QR_POSITION.x,
        y: template.qr_position_y || DEFAULT_QR_POSITION.y,
        width: template.qr_width || DEFAULT_QR_POSITION.width,
        height: template.qr_height || DEFAULT_QR_POSITION.height,
        rotation: 0,
      });
      setQrPositionSaved(true);
    } else {
      setQrPosition(DEFAULT_QR_POSITION);
      setQrPositionSaved(false);
    }
    
    setCustomTemplateFile(null);
    setCustomTemplatePreview(null);
  };

  const handleCustomTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedPdfTypes = ['application/pdf'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedPdfTypes];
    
    if (!allAllowedTypes.includes(file.type)) {
      setError(t('EVENT_UPLOAD_ERROR_FORMAT'));
      return;
    }

    const isPdf = allowedPdfTypes.includes(file.type);
    setCustomTemplateType(isPdf ? 'pdf' : 'image');

    // Reset QR position
    setQrPosition(DEFAULT_QR_POSITION);
    setQrPositionSaved(false);
    
    if (isPdf) {
      // For PDF, use object URL which works better with PDF.js
      const objectUrl = URL.createObjectURL(file);
      setCustomTemplatePreview(objectUrl);
    } else {
      // For images, use data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomTemplatePreview(result);
      };
      reader.readAsDataURL(file);
    }
    
    setCustomTemplateFile(file);
    setFormData(prev => ({ ...prev, template_id: '' }));
  };

  const removeCustomTemplate = () => {
    // Clean up object URL if it was a PDF
    if (customTemplatePreview && customTemplateType === 'pdf') {
      URL.revokeObjectURL(customTemplatePreview);
    }
    setCustomTemplateFile(null);
    setCustomTemplatePreview(null);
    setQrPosition(DEFAULT_QR_POSITION);
    setQrPositionSaved(false);
  };

  const handleOpenQREditor = () => {
    if (previewUrl) {
      setShowQREditor(true);
    }
  };

  const handleQRPositionSave = (position: QRPosition) => {
    setQrPosition(position);
    setQrPositionSaved(true);
    setShowQREditor(false);
  };

  const handleQREditorCancel = () => {
    setShowQREditor(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError(t('EVENT_REQUIRED_FIELD'));
      return false;
    }
    if (!formData.starts_at || !formData.ends_at) {
      setError(t('EVENT_REQUIRED_FIELD'));
      return false;
    }
    if (new Date(formData.ends_at) <= new Date(formData.starts_at)) {
      setError(t('EVENT_END_DATE_ERROR'));
      return false;
    }
    if (previewUrl && !qrPositionSaved) {
      setError(t('EVENT_QR_POSITION_REQUIRED'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      let templateId = formData.template_id;

      // Upload custom template if provided
      if (customTemplateFile && customTemplatePreview) {
        setUploadingTemplate(true);
        
        // Supabase Storage key must be URL-safe; sanitize filename
        const safeName = customTemplateFile.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')       // remove diacritics
          .replace(/[^\w.-]+/g, '_')            // replace non-url friendly chars
          .replace(/_+/g, '_')                  // collapse multiple underscores
          .replace(/^_+|_+$/g, '')              // trim underscores
          .toLowerCase();
        const fileName = `custom-templates/${Date.now()}-${safeName || 'template'}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-templates')
          .upload(fileName, customTemplateFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('event-templates')
          .getPublicUrl(fileName);

        // Create template record
        const templateResponse = await fetch('/api/event/templates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${formData.name} - Custom Template`,
            base_file_url: urlData.publicUrl,
            file_type: customTemplateType,
            qr_position_x: qrPosition.x,
            qr_position_y: qrPosition.y,
            qr_width: qrPosition.width,
            qr_height: qrPosition.height,
          }),
        });

        const templateData = await templateResponse.json();
        if (templateData.template) {
          templateId = templateData.template.id;
        }

        setUploadingTemplate(false);
      }

      const eventPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        venue: formData.venue.trim() || null,
        status: formData.status,
        template_id: templateId || null,
        max_guests: formData.max_guests,
        pass_max_uses: formData.pass_max_uses || 1,
        qr_position: qrPositionSaved ? qrPosition : null,
      };

      const url = isEditMode ? `/api/event/events/${eventId}` : '/api/event/events';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        const reason =
          typeof data?.message === 'string'
            ? data.message
            : data?.error
            ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
            : JSON.stringify(data);
        throw new Error(reason || t('EVENT_ERROR'));
      }

      router.push(`/${locale}/event/dashboard`);
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setSaving(false);
      setUploadingTemplate(false);
    }
  };

  const selectedTemplate = templates.find(tpl => tpl.id === formData.template_id);
  const previewUrl = customTemplatePreview || selectedTemplate?.base_file_url;
  const templateType = customTemplateFile ? customTemplateType : (selectedTemplate?.file_type as 'image' | 'pdf') || 'image';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? t('EVENT_EDIT_EVENT') : t('EVENT_CREATE_NEW_EVENT')}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Event Details */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('EVENT_EVENT_DETAILS')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_EVENT_NAME')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_EVENT_NAME_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_EVENT_DESCRIPTION')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_EVENT_DESCRIPTION_PLACEHOLDER')}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('EVENT_START_DATE')} *</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={formData.starts_at}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('EVENT_END_DATE')} *</label>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={formData.ends_at}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('EVENT_VENUE')}
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_VENUE_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_STATUS')}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">{t('EVENT_STATUS_DRAFT')}</option>
                  <option value="active">{t('EVENT_STATUS_ACTIVE')}</option>
                  <option value="archived">{t('EVENT_STATUS_ARCHIVED')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Limits Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('EVENT_LIMITS_SETTINGS')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('EVENT_MAX_GUESTS')}
                </label>
                <input
                  type="number"
                  name="max_guests"
                  value={formData.max_guests || ''}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_MAX_GUESTS_PLACEHOLDER')}
                  min={1}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-muted-foreground mt-1">{t('EVENT_MAX_GUESTS_HINT')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('EVENT_PASS_MAX_USES')}
                </label>
                <input
                  type="number"
                  name="pass_max_uses"
                  value={formData.pass_max_uses}
                  onChange={handleInputChange}
                  min={1}
                  max={100}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-muted-foreground mt-1">{t('EVENT_PASS_MAX_USES_HINT')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Template Settings */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {t('EVENT_TEMPLATE_SETTINGS')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_SELECT_TEMPLATE')}</label>
                <select
                  value={formData.template_id}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!!customTemplatePreview}
                >
                  <option value="">{t('EVENT_NO_TEMPLATE')}</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
                <div className="relative flex justify-center">
                  <span className="px-2 bg-card text-sm text-muted-foreground">{t('EVENT_OR')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_CUSTOM_TEMPLATE')}</label>
                <p className="text-sm text-muted-foreground mb-3">{t('EVENT_UPLOAD_TEMPLATE_HINT_EXTENDED')}</p>
                
                {customTemplatePreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeCustomTemplate}
                        className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="text-sm text-green-500 flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        {customTemplateType === 'pdf' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                        <span className="font-medium">{customTemplateFile?.name}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <span className="font-medium">{t('EVENT_UPLOAD_TEMPLATE')}</span>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleCustomTemplateUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* QR Position Preview & Editor */}
              {previewUrl && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {t('EVENT_QR_POSITION')}
                    </label>
                    {qrPositionSaved && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        ✓ {t('EVENT_QR_POSITION_SAVED')}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{t('EVENT_QR_POSITION_HINT_NEW')}</p>
                  
                  {/* Preview Thumbnail */}
                  <div 
                    className="relative border border-border rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                    style={{ maxHeight: '300px' }}
                    onClick={handleOpenQREditor}
                  >
                    {templateType === 'image' ? (
                      <img 
                        src={previewUrl} 
                        alt="Template Preview"
                        className="w-full h-auto object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-muted">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* QR Position Indicator */}
                    {qrPositionSaved && templateType === 'image' && (
                      <div
                        className="absolute border-2 border-primary bg-primary/20 rounded flex items-center justify-center"
                        style={{
                          left: `${qrPosition.x}%`,
                          top: `${qrPosition.y}%`,
                          width: `${qrPosition.width}%`,
                          height: `${qrPosition.height}%`,
                          transform: `translate(-50%, -50%) rotate(${qrPosition.rotation}deg)`,
                        }}
                      >
                        <QrCode className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="secondary">
                        <Settings className="h-4 w-4 mr-2" />
                        {qrPositionSaved ? t('EVENT_EDIT_QR_POSITION') : t('EVENT_SET_QR_POSITION')}
                      </Button>
                    </div>
                  </div>

                  {/* Quick info */}
                  {qrPositionSaved && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <div>X: {Math.round(qrPosition.x)}%</div>
                      <div>Y: {Math.round(qrPosition.y)}%</div>
                      <div>{t('EVENT_QR_SIZE')}: {Math.round(qrPosition.width)}%</div>
                    </div>
                  )}

                  {!qrPositionSaved && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-600">
                      ⚠️ {t('EVENT_QR_POSITION_WARNING')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              {t('EVENT_CANCEL')}
            </Button>
            <Button
              type="submit"
              disabled={saving || uploadingTemplate}
              className="flex-1"
            >
              {(saving || uploadingTemplate) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploadingTemplate ? t('EVENT_UPLOADING') : t('EVENT_SAVING')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? t('EVENT_UPDATE') : t('EVENT_CREATE')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* QR Position Editor Modal */}
      {showQREditor && previewUrl && (
        <QRPositionEditor
          templateUrl={previewUrl}
          templateType={templateType}
          initialPosition={qrPositionSaved ? qrPosition : undefined}
          onSave={handleQRPositionSave}
          onCancel={handleQREditorCancel}
        />
      )}
    </div>
  );
}
