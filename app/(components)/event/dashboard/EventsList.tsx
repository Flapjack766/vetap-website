'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Clock, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import { canCreateEvents, hasPermission } from '@/lib/event/permissions';
import type { Event, UserRole } from '@/lib/event/types';

interface EventsListProps {
  locale: string;
}

export function EventsList({ locale }: EventsListProps) {
  const router = useRouter();
  const t = useTranslations();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('organizer');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
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

      const response = await fetch('/api/event/events', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || t('EVENT_ERROR'));
      }

      setEvents(data.events || []);
    } catch (err: any) {
      console.error('❌ EventsList: Error:', err);
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

  const canEdit = hasPermission(userRole, 'events.edit');
  const canDelete = hasPermission(userRole, 'events.delete');
  const canCreate = canCreateEvents(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('EVENT_EVENTS')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('EVENT_EVENTS_DESC')}
          </p>
        </div>
        {canCreate && (
          <Link href={`/${locale}/event/dashboard/events/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('EVENT_CREATE_NEW_EVENT')}
            </Button>
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t('EVENT_NO_EVENTS')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {canCreate ? t('EVENT_NO_EVENTS_DESC') : t('EVENT_NO_EVENTS')}
          </p>
          {canCreate && (
            <Link href={`/${locale}/event/dashboard/events/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('EVENT_CREATE_EVENT')}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold line-clamp-2">{event.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(event.status)}`}>
                  {getStatusLabel(event.status)}
                </span>
              </div>

              {event.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.starts_at).toLocaleDateString(locale)}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(event.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(event.ends_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Link href={`/${locale}/event/dashboard/events/${event.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('EVENT_VIEW')}
                  </Button>
                </Link>
                {canEdit && (
                  <Link href={`/${locale}/event/dashboard/events/${event.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      {t('EVENT_EDIT')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
