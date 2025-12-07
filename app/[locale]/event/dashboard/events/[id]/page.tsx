'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Edit, 
  Users, 
  Ticket, 
  BarChart3,
  ArrowLeft,
  Loader2,
  FileImage,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { Event } from '@/lib/event/types';

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [passCount, setPassCount] = useState(0);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
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
      setGuestCount(guestsData.guests?.length || 0);

      const passesResponse = await fetch(`/api/event/events/${eventId}/passes`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const passesData = await passesResponse.json();
      setPassCount(passesData.passes?.length || 0);

    } catch (err: any) {
      console.error('Error fetching event:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'archived': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t('EVENT_STATUS_ACTIVE');
      case 'draft': return t('EVENT_STATUS_DRAFT');
      case 'archived': return t('EVENT_STATUS_ARCHIVED');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
        {error || t('EVENT_ERROR')}
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
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded border ${getStatusColor(event.status)}`}>
              {getStatusLabel(event.status)}
            </span>
          </div>
        </div>
        <Link href={`/${locale}/event/dashboard/events/${eventId}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            {t('EVENT_EDIT')}
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t('EVENT_EVENT_DETAILS')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {event.description && (
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">{t('EVENT_EVENT_DESCRIPTION')}</label>
              <p className="mt-1">{event.description}</p>
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('EVENT_START_DATE')}
            </label>
            <p className="mt-1 font-medium">
              {new Date(event.starts_at).toLocaleString(locale, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('EVENT_END_DATE')}
            </label>
            <p className="mt-1 font-medium">
              {new Date(event.ends_at).toLocaleString(locale, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>

          {event.venue && (
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('EVENT_VENUE')}
              </label>
              <p className="mt-1 font-medium">{event.venue}</p>
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {t('EVENT_TEMPLATES')}
            </label>
            <p className="mt-1 font-medium">
              {(event as any).template?.name || t('EVENT_NO_TEMPLATE')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/${locale}/event/dashboard/events/${eventId}/guests`} className="block">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('EVENT_GUESTS')}</h3>
                <p className="text-2xl font-bold">{guestCount}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              {t('EVENT_GUEST_MANAGEMENT')}
            </Button>
          </div>
        </Link>

        <Link href={`/${locale}/event/dashboard/events/${eventId}/invites`} className="block">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Ticket className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('EVENT_INVITES')}</h3>
                <p className="text-2xl font-bold">{passCount}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              {t('EVENT_GENERATE_INVITES')}
            </Button>
          </div>
        </Link>

        <Link href={`/${locale}/event/dashboard/events/${eventId}/statistics`} className="block">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('EVENT_STATISTICS')}</h3>
                <p className="text-sm text-muted-foreground">{t('EVENT_STATS_OVERVIEW')}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              {t('EVENT_VIEW_DETAILS')}
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}
