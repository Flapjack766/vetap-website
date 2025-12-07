'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Loader2, Plus, CreditCard, Link as LinkIcon, ExternalLink, Edit, Copy, QrCode, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NFCCard {
  id: string;
  label: string;
  nfc_uid: string | null;
  tracking_link_id: string | null;
  is_active: boolean;
  created_at: string;
  tracking_link?: {
    slug: string;
    destination_url: string;
  } | null;
}

interface TrackingLink {
  id: string;
  slug: string;
  destination_type: string;
}

interface NFCCardsTabProps {
  locale: string;
  branchId: string | null;
}

export function NFCCardsTab({ locale, branchId }: NFCCardsTabProps) {
  const [cards, setCards] = useState<NFCCard[]>([]);
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [writingNfc, setWritingNfc] = useState<string | null>(null);
  const [formattingNfc, setFormattingNfc] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    nfc_uid: '',
    tracking_link_id: '',
  });

  useEffect(() => {
    if (branchId) {
      fetchCards();
      fetchTrackingLinks();
    } else {
      setCards([]);
      setTrackingLinks([]);
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    // Check if Web NFC is supported
    if (typeof window !== 'undefined' && 'NDEFWriter' in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
    }
  }, []);

  const fetchTrackingLinks = async () => {
    if (!branchId) return;

    try {
      const { data, error } = await supabase
        .from('tracking_links')
        .select('id, slug, destination_type')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackingLinks(data || []);
    } catch (error: any) {
      console.error('Error fetching tracking links:', error);
    }
  };

  const fetchCards = async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nfc_cards')
        .select(`
          *,
          tracking_link:tracking_links(
            slug,
            destination_url
          )
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      console.error('Error fetching NFC cards:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_LOAD_CARDS'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('nfc_cards')
        .insert({
          branch_id: branchId,
          label: formData.label,
          nfc_uid: formData.nfc_uid || null,
          tracking_link_id: formData.tracking_link_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_CARD_CREATED'),
      });

      setIsDialogOpen(false);
      setFormData({ label: '', nfc_uid: '', tracking_link_id: '' });
      fetchCards();
    } catch (error: any) {
      console.error('Error creating NFC card:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_CREATE_CARD'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLink = (cardId: string) => {
    // Navigate to link builder with card pre-selected
    router.push(`/${locale}/dashboard/tracking/links?card_id=${cardId}`);
  };

  const handleLinkCard = async (cardId: string, trackingLinkId: string) => {
    try {
      const { error } = await supabase
        .from('nfc_cards')
        .update({ tracking_link_id: trackingLinkId })
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_CARD_LINKED'),
      });

      fetchCards();
    } catch (error: any) {
      console.error('Error linking card:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_LINK_CARD'),
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${siteUrl}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: t('TRACKING_COPIED'),
      description: t('TRACKING_LINK_COPIED'),
    });
  };

  const handleWriteToNFC = async (card: NFCCard) => {
    if (!card.tracking_link) {
      toast({
        title: t('TRACKING_ERROR'),
        description: t('TRACKING_CARD_NOT_LINKED'),
        variant: 'destructive',
      });
      return;
    }

    if (!nfcSupported) {
      toast({
        title: t('TRACKING_NOT_SUPPORTED'),
        description: t('TRACKING_WEB_NFC_BROWSER_NOTE'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setWritingNfc(card.id);
      const fullUrl = `${siteUrl}/r/${card.tracking_link.slug}`;

      const writer = new NDEFWriter();
      
      await writer.write({
        records: [
          {
            recordType: 'url',
            data: fullUrl,
          },
        ],
      });

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_NFC_WRITE_SUCCESS'),
      });
    } catch (error: any) {
      console.error('Error writing to NFC:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_NFC_ENSURE_ENABLED'),
        variant: 'destructive',
      });
    } finally {
      setWritingNfc(null);
    }
  };

  const handleFormatNFC = async (card: NFCCard) => {
    if (!nfcSupported) {
      toast({
        title: t('TRACKING_NOT_SUPPORTED'),
        description: t('TRACKING_WEB_NFC_BROWSER_NOTE'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setFormattingNfc(card.id);
      
      const writer = new NDEFWriter();
      
      // Format by writing empty records
      await writer.write({
        records: [],
      });

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_NFC_FORMAT_SUCCESS'),
      });
    } catch (error: any) {
      console.error('Error formatting NFC:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_NFC_ENSURE_ENABLED'),
        variant: 'destructive',
      });
    } finally {
      setFormattingNfc(null);
    }
  };

  if (!branchId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {t('TRACKING_SELECT_BRANCH_FIRST')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('TRACKING_NFC_CARDS')}
          </h2>
          <p className="text-muted-foreground">
            {t('TRACKING_NFC_CARDS_DESC')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('TRACKING_ADD_CARD')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('TRACKING_ADD_CARD_TITLE')}</DialogTitle>
              <DialogDescription>
                {t('TRACKING_ENTER_CARD_INFO')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">
                  {t('TRACKING_CARD_LABEL')} *
                </Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  placeholder={t('TRACKING_CARD_LABEL_PLACEHOLDER')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nfc_uid">
                  {t('TRACKING_NFC_UID')}
                </Label>
                <Input
                  id="nfc_uid"
                  value={formData.nfc_uid}
                  onChange={(e) => setFormData({ ...formData, nfc_uid: e.target.value })}
                  placeholder={t('TRACKING_NFC_UID_PLACEHOLDER')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_link_id">
                  {t('TRACKING_TRACKING_LINK')}
                </Label>
                <Input
                  id="tracking_link_id"
                  value={formData.tracking_link_id}
                  onChange={(e) => setFormData({ ...formData, tracking_link_id: e.target.value })}
                  placeholder={t('TRACKING_LINK_UUID_PLACEHOLDER')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('TRACKING_GENERATE_LINK_NOTE')}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  {t('TRACKING_CANCEL')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('TRACKING_CREATING')}
                    </>
                  ) : (
                    t('TRACKING_CREATE')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* NFC Support Alert */}
      {nfcSupported === false && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {t('TRACKING_WEB_NFC_NOT_SUPPORTED')}
          </AlertTitle>
          <AlertDescription>
            {t('TRACKING_WEB_NFC_NOT_SUPPORTED_DESC')}
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('TRACKING_WEB_NFC_CHROME_ANDROID')}</li>
              <li>{t('TRACKING_WEB_NFC_ANDROID_VERSION')}</li>
              <li>{t('TRACKING_WEB_NFC_DEVICE_SUPPORT')}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t('TRACKING_NO_CARDS')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const fullUrl = card.tracking_link ? `${siteUrl}/r/${card.tracking_link.slug}` : null;
            
            return (
              <Card key={card.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {card.label}
                  </CardTitle>
                  <CardDescription>
                    {card.is_active 
                      ? t('TRACKING_CARD_ACTIVE')
                      : t('TRACKING_CARD_INACTIVE')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {card.nfc_uid && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          {t('TRACKING_UID_LABEL')}
                        </span>
                        <span className="ml-2 font-mono">{card.nfc_uid}</span>
                      </div>
                    )}
                    
                    {card.tracking_link ? (
                      <div className="space-y-3">
                        {/* Link Display */}
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t('TRACKING_LINK_LABEL')}
                          </span>
                          <a
                            href={`/r/${card.tracking_link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            /r/{card.tracking_link.slug}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                          <QRCodeSVG
                            value={fullUrl || ''}
                            size={120}
                            level="M"
                            includeMargin={false}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('TRACKING_QR_CODE')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleCopyLink(card.tracking_link!.slug)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            {t('TRACKING_COPY_LINK')}
                          </Button>

                          {nfcSupported && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleWriteToNFC(card)}
                                disabled={writingNfc === card.id}
                              >
                                {writingNfc === card.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('TRACKING_WRITING')}
                                  </>
                                ) : (
                                  <>
                                    <Wifi className="h-4 w-4 mr-2" />
                                    {t('TRACKING_WRITE_TO_NFC')}
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleFormatNFC(card)}
                                disabled={formattingNfc === card.id}
                              >
                                {formattingNfc === card.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('TRACKING_FORMATTING')}
                                  </>
                                ) : (
                                  <>
                                    <WifiOff className="h-4 w-4 mr-2" />
                                    {t('TRACKING_FORMAT_CARD')}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {trackingLinks.length > 0 ? (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              {t('TRACKING_LINK_TO_EXISTING')}
                            </Label>
                            <Select
                              onValueChange={(value) => {
                                if (value === 'new') {
                                  handleGenerateLink(card.id);
                                } else {
                                  handleLinkCard(card.id, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('TRACKING_SELECT_LINK')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">
                                  {t('TRACKING_CREATE_NEW_LINK')}
                                </SelectItem>
                                {trackingLinks.map((link) => (
                                  <SelectItem key={link.id} value={link.id}>
                                    /r/{link.slug} ({link.destination_type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleGenerateLink(card.id)}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            {t('TRACKING_GENERATE_NEW_LINK')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

