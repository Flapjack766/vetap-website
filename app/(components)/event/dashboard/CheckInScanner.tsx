'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  CameraOff,
  RefreshCw,
  User,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { Event, ScanResult } from '@/lib/event/types';

interface CheckInScannerProps {
  locale: string;
}

interface ScanResultData {
  result: ScanResult;
  guest_name?: string;
  message?: string;
  scanned_at?: string;
}

export function CheckInScanner({ locale }: CheckInScannerProps) {
  const router = useRouter();
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedGateId, setSelectedGateId] = useState<string>('');
  const [gates, setGates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [lastScanResult, setLastScanResult] = useState<ScanResultData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResultData[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchGates(selectedEventId);
    }
  }, [selectedEventId]);

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

      const response = await fetch('/api/event/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (data.events) {
        // Filter only active events
        const activeEvents = data.events.filter((e: Event) => e.status === 'active');
        setEvents(activeEvents);
        if (activeEvents.length === 1) {
          setSelectedEventId(activeEvents[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGates = async (eventId: string) => {
    try {
      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data: gatesData } = await supabase
        .from('event_gates')
        .select('id, name')
        .eq('event_id', eventId);

      if (gatesData) {
        setGates(gatesData);
        if (gatesData.length === 1) {
          setSelectedGateId(gatesData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching gates:', err);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
        setScanning(true);
        scanQRCode();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(t('EVENT_CAMERA_PERMISSION'));
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setCameraReady(false);
  };

  const scanQRCode = async () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR scanning
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(imageData);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          await processQRCode(qrData);
        }
      } catch (err) {
        // Continue scanning
      }
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const processQRCode = async (qrPayload: string) => {
    if (processing) return;
    
    try {
      setProcessing(true);
      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/event/qr/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_payload: qrPayload,
          event_id: selectedEventId,
          gate_id: selectedGateId || undefined,
        }),
      });

      const data = await response.json();
      
      const scanResultData: ScanResultData = {
        result: data.result || 'invalid',
        guest_name: data.guest?.full_name,
        message: data.message,
        scanned_at: new Date().toISOString(),
      };

      setLastScanResult(scanResultData);
      setScanHistory(prev => [scanResultData, ...prev.slice(0, 9)]); // Keep last 10

      // Play sound or vibrate based on result
      if (data.result === 'valid') {
        // Success feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      } else {
        // Error feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 100, 100]);
        }
      }

      // Clear result after 3 seconds
      setTimeout(() => {
        setLastScanResult(null);
      }, 3000);

    } catch (err: any) {
      console.error('Error processing QR:', err);
      setLastScanResult({
        result: 'invalid',
        message: err.message,
        scanned_at: new Date().toISOString(),
      });
    } finally {
      setProcessing(false);
    }
  };

  const getResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'bg-green-500';
      case 'already_used': return 'bg-yellow-500';
      case 'invalid': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      case 'not_allowed_zone': return 'bg-orange-500';
      case 'revoked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultIcon = (result: ScanResult) => {
    switch (result) {
      case 'valid': return <CheckCircle className="h-16 w-16 text-white" />;
      default: return <XCircle className="h-16 w-16 text-white" />;
    }
  };

  const getResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid': return t('EVENT_SCAN_RESULT_VALID');
      case 'already_used': return t('EVENT_SCAN_RESULT_ALREADY_USED');
      case 'invalid': return t('EVENT_SCAN_RESULT_INVALID');
      case 'expired': return t('EVENT_SCAN_RESULT_EXPIRED');
      case 'not_allowed_zone': return t('EVENT_SCAN_RESULT_NOT_ALLOWED_ZONE');
      case 'revoked': return t('EVENT_SCAN_RESULT_REVOKED');
      default: return result;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="h-6 w-6" />
          {t('EVENT_SCANNER_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('EVENT_SCANNER_DESC')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Event & Gate Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('EVENT_SCANNER_SELECT_EVENT')}</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={scanning}
          >
            <option value="">{t('EVENT_SCANNER_SELECT_EVENT')}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        {gates.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">{t('EVENT_SCANNER_SELECT_GATE')}</label>
            <select
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={scanning}
            >
              <option value="">{t('EVENT_SCANNER_SELECT_GATE')}</option>
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>{gate.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
      <div className="flex gap-4">
        {!scanning ? (
          <Button 
            onClick={startCamera} 
            disabled={!selectedEventId}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            {t('EVENT_SCANNER_START')}
          </Button>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="destructive"
            className="flex-1"
          >
            <CameraOff className="h-4 w-4 mr-2" />
            {t('EVENT_SCANNER_STOP')}
          </Button>
        )}
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div>
              <CameraOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{cameraError}</p>
            </div>
          </div>
        ) : !scanning ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div>
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('EVENT_SCANNER_READY')}</p>
            </div>
          </div>
        ) : null}

        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!scanning ? 'hidden' : ''}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan Result Overlay */}
        {lastScanResult && (
          <div className={`absolute inset-0 flex items-center justify-center ${getResultColor(lastScanResult.result)}`}>
            <div className="text-center text-white">
              {getResultIcon(lastScanResult.result)}
              <p className="text-2xl font-bold mt-4">{getResultLabel(lastScanResult.result)}</p>
              {lastScanResult.guest_name && (
                <p className="text-xl mt-2 flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  {lastScanResult.guest_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">{t('EVENT_STATS_RECENT_SCANS')}</h3>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getResultColor(scan.result)}`} />
                  <div>
                    <p className="font-medium">{scan.guest_name || '-'}</p>
                    <p className="text-sm text-muted-foreground">{getResultLabel(scan.result)}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(scan.scanned_at!).toLocaleTimeString(locale)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

