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
import { Loader2, Plus, Building2, MapPin, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';

interface Business {
  id: string;
  name: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  slug: string | null;
  created_at: string;
}

interface BusinessesTabProps {
  locale: string;
  onBusinessSelect: (businessId: string) => void;
}

export function BusinessesTab({ locale, onBusinessSelect }: BusinessesTabProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    city: '',
    slug: '',
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('businesses')
        .insert({
          owner_user_id: user.id,
          name: formData.name,
          industry: formData.industry || null,
          country: formData.country || null,
          city: formData.city || null,
          slug: formData.slug || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_BUSINESS_CREATED'),
      });

      setIsDialogOpen(false);
      setFormData({ name: '', industry: '', country: '', city: '', slug: '' });
      fetchBusinesses();
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_CREATE_BUSINESS'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            {t('TRACKING_BUSINESSES')}
          </h2>
          <p className="text-muted-foreground">
            {t('TRACKING_BUSINESSES_DESC')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('TRACKING_ADD_BUSINESS')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('TRACKING_ADD_BUSINESS_TITLE')}</DialogTitle>
              <DialogDescription>
                {t('TRACKING_ENTER_BUSINESS_INFO')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('TRACKING_BUSINESS_NAME')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t('TRACKING_BUSINESS_NAME_PLACEHOLDER')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t('TRACKING_INDUSTRY')}
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder={t('TRACKING_INDUSTRY_PLACEHOLDER')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">
                    {t('TRACKING_COUNTRY')}
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder={t('TRACKING_COUNTRY_PLACEHOLDER')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    {t('TRACKING_CITY')}
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('TRACKING_CITY_PLACEHOLDER')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  {t('TRACKING_CUSTOM_SLUG')}
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder={t('TRACKING_CUSTOM_SLUG_PLACEHOLDER')}
                />
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

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t('TRACKING_NO_BUSINESSES')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card 
              key={business.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onBusinessSelect(business.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {business.name}
                </CardTitle>
                <CardDescription>
                  {business.industry || t('TRACKING_NO_INDUSTRY')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {business.city && business.country && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {business.city}, {business.country}
                    </div>
                  )}
                  {business.slug && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      /{business.slug}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

