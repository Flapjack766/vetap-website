'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  DoorOpen,
  ChevronRight,
  Loader2,
  LogOut,
  AlertCircle,
  QrCode,
  MapPin,
  Clock,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient, clearEventClient } from '@/lib/supabase/event-client';
import type { Event } from '@/lib/event/types';

interface EventGateSelectorProps {
  locale: string;
}

interface Gate {
  id: string;
  name: string;
  description?: string;
  allowed_guest_types?: string[];
}

export function EventGateSelector({ locale }: EventGateSelectorProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'event' | 'gate'>('event');

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
        router.push(`/${locale}/event/check-in`);
        return;
      }

      const response = await fetch('/api/event/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (data.events) {
        // Filter only active events
        const activeEvents = data.events.filter((e: Event) => e.status === 'active');
        setEvents(activeEvents);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || t('CHECKIN_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGates = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: gatesData, error: gatesError } = await supabase
        .from('event_gates')
        .select('id, name')
        .eq('event_id', eventId);

      if (gatesError) {
        throw new Error(gatesError.message);
      }

      if (gatesData && gatesData.length > 0) {
        setGates(gatesData);
        setStep('gate');
      } else {
        // No gates configured, go directly to scanner with no specific gate
        startScanning(eventId, null);
      }
    } catch (err: any) {
      console.error('Error fetching gates:', err);
      setError(err.message || t('CHECKIN_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchGates(event.id);
  };

  const handleSelectGate = (gate: Gate) => {
    setSelectedGate(gate);
    if (selectedEvent) {
      startScanning(selectedEvent.id, gate.id);
    }
  };

  const startScanning = (eventId: string, gateId: string | null) => {
    // Store selection in session storage
    sessionStorage.setItem('check_in_session', JSON.stringify({
      event_id: eventId,
      event_name: selectedEvent?.name,
      gate_id: gateId,
      gate_name: selectedGate?.name || gates.find(g => g.id === gateId)?.name,
    }));

    router.push(`/${locale}/event/check-in/scan`);
  };

  const handleLogout = async () => {
    const supabase = createEventClient();
    await supabase.auth.signOut();
    clearEventClient();
    sessionStorage.removeItem('check_in_session');
    sessionStorage.removeItem('gate_session');
    router.push(`/${locale}/event/check-in`);
  };

  const goBackToEvents = () => {
    setStep('event');
    setSelectedEvent(null);
    setSelectedGate(null);
    setGates([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">{t('CHECKIN_LOADING')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">{t('CHECKIN_TITLE')}</h1>
            <p className="text-slate-500 text-sm">
              {step === 'event' ? t('CHECKIN_SELECT_EVENT') : t('CHECKIN_SELECT_GATE')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'event' ? (
          <>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              {t('CHECKIN_ACTIVE_EVENTS')}
            </h2>

            {events.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">{t('CHECKIN_NO_ACTIVE_EVENTS')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                          {event.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(event.starts_at).toLocaleDateString(locale)}
                          </span>
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(event.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {event.venue && (
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={goBackToEvents}
              className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1"
            >
              ← {t('CHECKIN_BACK')}
            </button>

            {/* Selected event info */}
            {selectedEvent && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                <h3 className="text-emerald-400 font-semibold">{selectedEvent.name}</h3>
                <p className="text-emerald-400/70 text-sm mt-1">
                  {new Date(selectedEvent.starts_at).toLocaleDateString(locale)}
                </p>
              </div>
            )}

            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-emerald-500" />
              {t('CHECKIN_SELECT_GATE')}
            </h2>

            {gates.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <DoorOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4">{t('CHECKIN_NO_GATES')}</p>
                <Button
                  onClick={() => startScanning(selectedEvent!.id, null)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {t('CHECKIN_START_WITHOUT_GATE')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {gates.map((gate) => (
                  <button
                    key={gate.id}
                    onClick={() => handleSelectGate(gate)}
                    className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-slate-500" />
                          {gate.name}
                        </h3>
                        {gate.description && (
                          <p className="text-slate-400 text-sm mt-1">{gate.description}</p>
                        )}
                        {gate.allowed_guest_types && gate.allowed_guest_types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {gate.allowed_guest_types.map((type) => (
                              <span
                                key={type}
                                className="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </button>
                ))}

                <div className="pt-4 border-t border-slate-700/50">
                  <Button
                    variant="outline"
                    onClick={() => startScanning(selectedEvent!.id, null)}
                    className="w-full border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                  >
                    {t('CHECKIN_SKIP_GATE_SELECTION')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

