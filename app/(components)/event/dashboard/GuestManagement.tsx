'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Users,
  Plus,
  Upload,
  Search,
  Edit,
  Trash2,
  Filter,
  X,
  Loader2,
  Download,
  ArrowLeft,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import { hasPermission } from '@/lib/event/permissions';
import type { Guest, GuestType, Event, UserRole } from '@/lib/event/types';

interface GuestManagementProps {
  locale: string;
  eventId: string;
}

interface GuestFormData {
  full_name: string;
  email: string;
  phone: string;
  type: GuestType;
  notes: string;
}

const initialFormData: GuestFormData = {
  full_name: '',
  email: '',
  phone: '',
  type: 'Regular',
  notes: '',
};

export function GuestManagement({ locale, eventId }: GuestManagementProps) {
  const router = useRouter();
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('organizer');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);

  const [formData, setFormData] = useState<GuestFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<GuestType | ''>('');

  const guestTypes: { value: GuestType; label: string }[] = [
    { value: 'VIP', label: t('EVENT_GUEST_TYPE_VIP') },
    { value: 'Regular', label: t('EVENT_GUEST_TYPE_REGULAR') },
    { value: 'Staff', label: t('EVENT_GUEST_TYPE_STAFF') },
    { value: 'Media', label: t('EVENT_GUEST_TYPE_MEDIA') },
    { value: 'Other', label: t('EVENT_GUEST_TYPE_OTHER') },
  ];

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

      // Get user role
      const { data: userData } = await supabase
        .from('event_users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }

      const eventResponse = await fetch(`/api/event/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const eventData = await eventResponse.json();
      
      if (!eventResponse.ok) {
        throw new Error(eventData.message || t('EVENT_ERROR'));
      }
      setEvent(eventData.event);

      const guestsResponse = await fetch(`/api/event/events/${eventId}/guests`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const guestsData = await guestsResponse.json();
      
      if (guestsData.guests) {
        setGuests(guestsData.guests);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingGuest(null);
    setShowAddModal(true);
  };

  const openEditModal = (guest: Guest) => {
    setFormData({
      full_name: guest.full_name,
      email: guest.email || '',
      phone: guest.phone || '',
      type: guest.type,
      notes: guest.notes || '',
    });
    setEditingGuest(guest);
    setShowAddModal(true);
  };

  const openDeleteModal = (guest: Guest) => {
    setDeletingGuest(guest);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setEditingGuest(null);
    setDeletingGuest(null);
    setFormData(initialFormData);
  };

  const handleSaveGuest = async () => {
    if (!formData.full_name.trim()) {
      setError(t('EVENT_REQUIRED_FIELD'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const guestPayload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        type: formData.type,
        notes: formData.notes.trim() || undefined,
      };

      const response = await fetch(`/api/event/events/${eventId}/guests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('EVENT_ERROR'));
      }

      setSuccessMessage(editingGuest ? t('EVENT_GUEST_UPDATED') : t('EVENT_GUEST_ADDED'));

      closeModals();
      fetchData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving guest:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuest = async () => {
    if (!deletingGuest) return;

    try {
      setSaving(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const { error: deleteError } = await supabase
        .from('event_guests')
        .delete()
        .eq('id', deletingGuest.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccessMessage(t('EVENT_GUEST_DELETED'));
      closeModals();
      fetchData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting guest:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error(t('EVENT_CSV_EMPTY_ERROR'));
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIndex = headers.findIndex(h => h === 'full_name' || h === 'name');
      const emailIndex = headers.findIndex(h => h === 'email');
      const phoneIndex = headers.findIndex(h => h === 'phone');
      const typeIndex = headers.findIndex(h => h === 'type');
      const notesIndex = headers.findIndex(h => h === 'notes');

      if (nameIndex === -1) {
        throw new Error(t('EVENT_CSV_NAME_REQUIRED'));
      }

      const guestsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const fullName = values[nameIndex];
        
        if (!fullName) continue;

        const type = values[typeIndex] as GuestType;
        const validTypes: GuestType[] = ['VIP', 'Regular', 'Staff', 'Media', 'Other'];

        guestsToImport.push({
          full_name: fullName,
          email: emailIndex >= 0 ? values[emailIndex] : undefined,
          phone: phoneIndex >= 0 ? values[phoneIndex] : undefined,
          type: validTypes.includes(type) ? type : 'Regular',
          notes: notesIndex >= 0 ? values[notesIndex] : undefined,
        });
      }

      if (guestsToImport.length === 0) {
        throw new Error(t('EVENT_CSV_NO_GUESTS'));
      }

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch(`/api/event/events/${eventId}/guests/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guests: guestsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('EVENT_IMPORT_ERROR'));
      }

      setSuccessMessage(t('EVENT_IMPORT_SUCCESS', { count: data.imported }));
      fetchData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error importing CSV:', err);
      setError(err.message || t('EVENT_IMPORT_ERROR'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportGuests = () => {
    const headers = ['full_name', 'email', 'phone', 'type', 'notes'];
    const csvContent = [
      headers.join(','),
      ...guests.map(g => [
        `"${g.full_name}"`,
        `"${g.email || ''}"`,
        `"${g.phone || ''}"`,
        `"${g.type}"`,
        `"${g.notes || ''}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `guests-${eventId}.csv`;
    link.click();
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = !searchQuery || 
      guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone?.includes(searchQuery);
    
    const matchesType = !filterType || guest.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: GuestType) => {
    const typeObj = guestTypes.find(gt => gt.value === type);
    return typeObj?.label || type;
  };

  const getTypeColor = (type: GuestType) => {
    switch (type) {
      case 'VIP': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Staff': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Media': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Regular': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Permission checks
  const canAddGuests = hasPermission(userRole, 'guests.create');
  const canEditGuests = hasPermission(userRole, 'guests.edit');
  const canDeleteGuests = hasPermission(userRole, 'guests.delete');
  const canImportGuests = hasPermission(userRole, 'guests.import');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/event/dashboard`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {t('EVENT_GUEST_MANAGEMENT')}
            </h1>
            {event && <p className="text-muted-foreground">{event.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('EVENT_TOTAL_GUESTS')}: <span className="font-semibold text-foreground">{guests.length}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-500">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('EVENT_SEARCH_GUESTS')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as GuestType | '')}
            className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('EVENT_ALL_TYPES')}</option>
            {guestTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportGuests} disabled={guests.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {t('EVENT_EXPORT_GUESTS')}
          </Button>
          
          {canImportGuests && (
            <label className="cursor-pointer">
              <Button variant="outline" asChild disabled={importing}>
                <span>
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {importing ? t('EVENT_IMPORTING') : t('EVENT_IMPORT_FROM_CSV')}
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
            </label>
          )}

          {canAddGuests && (
            <Button onClick={openAddModal}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('EVENT_ADD_GUEST')}
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t('EVENT_CSV_FORMAT_HINT')}</p>

      {filteredGuests.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('EVENT_NO_GUESTS')}</h3>
          <p className="text-muted-foreground mb-4">{t('EVENT_NO_GUESTS_DESC')}</p>
          {canAddGuests && (
            <div className="flex justify-center gap-4">
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                {t('EVENT_ADD_GUEST')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_NAME')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_EMAIL')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_PHONE')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_TYPE')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_NOTES')}</th>
                  <th className="text-end px-4 py-3 font-medium">{t('EVENT_ACTIONS')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{guest.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.email || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(guest.type)}`}>
                        {getTypeLabel(guest.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {guest.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-2">
                        {canEditGuests && (
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(guest)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteGuests && (
                          <Button variant="ghost" size="icon" onClick={() => openDeleteModal(guest)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {editingGuest ? t('EVENT_EDIT_GUEST') : t('EVENT_ADD_GUEST')}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModals}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_GUEST_NAME')} *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_GUEST_NAME_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_GUEST_EMAIL')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_GUEST_EMAIL_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_GUEST_PHONE')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_GUEST_PHONE_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_GUEST_TYPE')}</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {guestTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_GUEST_NOTES')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t('EVENT_GUEST_NOTES_PLACEHOLDER')}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={closeModals} disabled={saving}>
                {t('EVENT_CANCEL')}
              </Button>
              <Button onClick={handleSaveGuest} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('EVENT_SAVE')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm">
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('EVENT_DELETE_GUEST')}</h3>
              <p className="text-muted-foreground mb-2">{t('EVENT_CONFIRM_DELETE_GUEST')}</p>
              <p className="font-medium mb-4">{deletingGuest.full_name}</p>
              <p className="text-sm text-red-500">{t('EVENT_DELETE_WARNING')}</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={closeModals} disabled={saving}>
                {t('EVENT_CANCEL')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteGuest} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('EVENT_DELETE')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
