'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import { hasPermission, canCreateEvents } from '@/lib/event/permissions';
import { AccessDenied } from '@/app/(components)/event/dashboard/AccessDenied';
import type { Event, UserRole } from '@/lib/event/types';

export default function GuestsIndexPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
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
      } else {
        setUserRole('organizer');
      }

      const response = await fetch('/api/event/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (data.events) {
        setEvents(data.events);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check permission
  if (userRole && !hasPermission(userRole, 'guests.view')) {
    return <AccessDenied locale={locale} />;
  }

  const canCreate = userRole ? canCreateEvents(userRole) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          {t('EVENT_GUEST_MANAGEMENT')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('EVENT_SELECT_EVENT_GUESTS')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('EVENT_NO_EVENTS')}</h3>
          {canCreate && (
            <Link href={`/${locale}/event/dashboard/events/new`}>
              <Button>{t('EVENT_CREATE_NEW_EVENT')}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/${locale}/event/dashboard/events/${event.id}/guests`}>
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.starts_at).toLocaleDateString(locale)}</span>
                </div>
                <Button variant="outline" className="w-full">
                  {t('EVENT_GUEST_MANAGEMENT')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
