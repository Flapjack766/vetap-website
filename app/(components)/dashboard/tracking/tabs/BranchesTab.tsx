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
import { Loader2, Plus, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';

interface Branch {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  google_place_id: string | null;
}

interface BranchesTabProps {
  locale: string;
  businessId: string | null;
  onBranchSelect: (branchId: string) => void;
}

export function BranchesTab({ locale, businessId, onBranchSelect }: BranchesTabProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    google_maps_url: '',
    google_place_id: '',
  });

  useEffect(() => {
    if (businessId) {
      fetchBranches();
    } else {
      setBranches([]);
      setLoading(false);
    }
  }, [businessId]);

  const fetchBranches = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select('*')
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          business_id: businessId,
          name: formData.name,
          city: formData.city || null,
          district: formData.district || null,
          address: formData.address || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          google_maps_url: formData.google_maps_url || null,
          google_place_id: formData.google_place_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('TRACKING_SUCCESS'),
        description: t('TRACKING_BRANCH_CREATED'),
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        city: '',
        district: '',
        address: '',
        latitude: '',
        longitude: '',
        google_maps_url: '',
        google_place_id: '',
      });
      fetchBranches();
    } catch (error: any) {
      console.error('Error creating branch:', error);
      toast({
        title: t('TRACKING_ERROR'),
        description: error.message || t('TRACKING_FAILED_CREATE_BRANCH'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {t('TRACKING_SELECT_BUSINESS_FIRST')}
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
            {t('TRACKING_BRANCHES')}
          </h2>
          <p className="text-muted-foreground">
            {t('TRACKING_BRANCHES_DESC')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('TRACKING_ADD_BRANCH')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('TRACKING_ADD_BRANCH_TITLE')}</DialogTitle>
              <DialogDescription>
                {t('TRACKING_ENTER_BRANCH_INFO')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('TRACKING_BRANCH_NAME')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t('TRACKING_BRANCH_NAME_PLACEHOLDER')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="district">
                    {t('TRACKING_DISTRICT')}
                  </Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder={t('TRACKING_DISTRICT_PLACEHOLDER')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">
                  {t('TRACKING_ADDRESS')}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('TRACKING_ADDRESS_PLACEHOLDER')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">
                    {t('TRACKING_LATITUDE')}
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="24.7136"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">
                    {t('TRACKING_LONGITUDE')}
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="46.6753"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_maps_url">
                  {t('TRACKING_GOOGLE_MAPS_URL')}
                </Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_place_id">
                  {t('TRACKING_GOOGLE_PLACE_ID')}
                </Label>
                <Input
                  id="google_place_id"
                  value={formData.google_place_id}
                  onChange={(e) => setFormData({ ...formData, google_place_id: e.target.value })}
                  placeholder="ChIJ..."
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

      {/* Branches List */}
      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t('TRACKING_NO_BRANCHES')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch) => (
            <Card 
              key={branch.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onBranchSelect(branch.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {branch.name}
                </CardTitle>
                <CardDescription>
                  {branch.city && branch.district 
                    ? `${branch.district}, ${branch.city}`
                    : branch.city || branch.district || t('TRACKING_NO_LOCATION')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {branch.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Navigation className="h-4 w-4 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.google_maps_url && (
                    <a
                      href={branch.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('TRACKING_VIEW_ON_MAP')}
                    </a>
                  )}
                  {branch.latitude && branch.longitude && (
                    <div className="text-xs text-muted-foreground">
                      {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
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

