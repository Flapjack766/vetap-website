'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  DoorOpen,
  ChevronRight,
  ChevronLeft,
  Loader2,
  LogOut,
  AlertCircle,
  Scan,
  MapPin,
  Clock,
  QrCode,
  Settings,
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
  const isRTL = locale === 'ar';

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
      <div className="fixed top-16 inset-x-0 bottom-0 bg-background flex items-center justify-center z-40" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('CHECKIN_LOADING')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 bg-background flex flex-col z-40" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Pattern - Same as QRScanner */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      </div>

      {/* Header Bar - Same style as QRScanner stats bar */}
      <div className="bg-card/95 backdrop-blur-xl p-3 flex items-center justify-between z-20 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-foreground font-semibold">{t('CHECKIN_TITLE')}</h1>
            <p className="text-muted-foreground text-xs">
              {step === 'event' ? t('CHECKIN_SELECT_EVENT') : t('CHECKIN_SELECT_GATE')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Selected Event Info Bar - Same style as QRScanner event bar */}
      {selectedEvent && step === 'gate' && (
        <div className="bg-card/80 backdrop-blur px-4 py-2 flex items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{selectedEvent.name}</span>
            <span className="text-border">•</span>
            <span className="text-muted-foreground text-xs">
              {new Date(selectedEvent.starts_at).toLocaleDateString(locale)}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {step === 'event' ? (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                {t('CHECKIN_ACTIVE_EVENTS')}
              </h2>

              {events.length === 0 ? (
                <div className="text-center py-16 bg-card/50 backdrop-blur rounded-2xl border border-border/50">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{t('CHECKIN_NO_ACTIVE_EVENTS')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="w-full bg-card/50 hover:bg-card/80 backdrop-blur border border-border/50 hover:border-emerald-500/50 rounded-xl p-4 sm:p-5 text-start transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold group-hover:text-emerald-400 transition-colors truncate">
                            {event.name}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-emerald-500/70" />
                              {new Date(event.starts_at).toLocaleDateString(locale)}
                            </span>
                            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-emerald-500/70" />
                              {new Date(event.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.venue && (
                              <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500/70" />
                                {event.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                          <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
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
                className="text-muted-foreground hover:text-emerald-400 text-sm mb-6 flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                {t('CHECKIN_BACK')}
              </button>

              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <DoorOpen className="h-5 w-5 text-teal-400" />
                </div>
                {t('CHECKIN_SELECT_GATE')}
              </h2>

              {gates.length === 0 ? (
                <div className="text-center py-16 bg-card/50 backdrop-blur rounded-2xl border border-border/50">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <DoorOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-6">{t('CHECKIN_NO_GATES')}</p>
                  <Button
                    onClick={() => startScanning(selectedEvent!.id, null)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 px-6 shadow-lg shadow-emerald-500/20"
                  >
                    <Scan className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('CHECKIN_START_WITHOUT_GATE')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {gates.map((gate) => (
                    <button
                      key={gate.id}
                      onClick={() => handleSelectGate(gate)}
                      className="w-full bg-card/50 hover:bg-card/80 backdrop-blur border border-border/50 hover:border-emerald-500/50 rounded-xl p-4 sm:p-5 text-start transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                            <DoorOpen className="h-4 w-4 text-teal-500/70" />
                            {gate.name}
                          </h3>
                          {gate.description && (
                            <p className="text-muted-foreground text-sm mt-1">{gate.description}</p>
                          )}
                          {gate.allowed_guest_types && gate.allowed_guest_types.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {gate.allowed_guest_types.map((type) => (
                                <span
                                  key={type}
                                  className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                          <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-muted-foreground text-xs uppercase">{t('CHECKIN_OR') || 'OR'}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => startScanning(selectedEvent!.id, null)}
                    className="w-full h-12 border-border/50 text-muted-foreground hover:text-foreground hover:border-muted-foreground hover:bg-muted/50"
                  >
                    {t('CHECKIN_SKIP_GATE_SELECTION')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
