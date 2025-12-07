'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Camera,
  CameraOff,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Upload,
  SwitchCamera,
  Volume2,
  VolumeX,
  Ticket,
  ArrowDown,
  ArrowUp,
  Target,
  Sun,
  Move,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { Event, ScanResult } from '@/lib/event/types';
import { 
  QRScannerEngine, 
  ScanFeedback, 
  ScanStatus,
} from '@/lib/event/qr-scanner-engine';

interface CheckInScannerProps {
  locale: string;
}

interface ScanResultData {
  result: ScanResult;
  guest_name?: string;
  guest_type?: string;
  message?: string;
  errorKey?: string;  // Translation key for error messages
  scanned_at?: string;
  first_used_at?: string;
}

export function CheckInScanner({ locale }: CheckInScannerProps) {
  const router = useRouter();
  const t = useTranslations();
  const isRTL = locale === 'ar';
  
  // Scanner Engine - 1.5 second cooldown for faster scanning
  const scannerEngine = useRef<QRScannerEngine>(new QRScannerEngine(1500));
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScannningRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedGateId, setSelectedGateId] = useState<string>('');
  const [gates, setGates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanCount, setScanCount] = useState(0);
  
  const [lastScanResult, setLastScanResult] = useState<ScanResultData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResultData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time feedback from scanner engine
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    already_used: 0,
    invalid: 0,
  });

  // Local storage key for per-event/gate history persistence
  const historyKey = useMemo(() => {
    if (!selectedEventId) return null;
    return `scan_history_${selectedEventId}_${selectedGateId || 'all'}`;
  }, [selectedEventId, selectedGateId]);

  const computeStats = (history: ScanResultData[]) => ({
    total: history.length,
    valid: history.filter(h => h.result === 'valid').length,
    already_used: history.filter(h => h.result === 'already_used').length,
    invalid: history.filter(h => !['valid', 'already_used'].includes(h.result)).length,
  });

  const persistHistory = (history: ScanResultData[]) => {
    if (!historyKey || typeof window === 'undefined') return;
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)));
  };

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Load cached history when event/gate changes (before API)
  useEffect(() => {
    if (!historyKey || typeof window === 'undefined') return;
    const cached = localStorage.getItem(historyKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ScanResultData[];
        setScanHistory(parsed);
        setStats(computeStats(parsed));
      } catch {
        // ignore parse errors
      }
    } else {
      setScanHistory([]);
      setStats({ total: 0, valid: 0, already_used: 0, invalid: 0 });
    }
  }, [historyKey]);

  useEffect(() => {
    if (selectedEventId) {
      fetchGates(selectedEventId);
      // Load scan history for selected event
      loadScanHistory(selectedEventId, selectedGateId);
    }
  }, [selectedEventId, selectedGateId]);

  // Load scan history from API
  const loadScanHistory = async (eventId: string, gateId?: string) => {
    try {
      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });
      if (gateId) {
        params.append('gate_id', gateId);
      }

      const response = await fetch(`/api/event/events/${eventId}/scan-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.logs && Array.isArray(data.logs)) {
        // Transform API logs to ScanResultData format
        const history: ScanResultData[] = data.logs.map((log: any) => ({
          result: log.result,
          guest_name: log.pass?.guest?.full_name,
          guest_type: log.pass?.guest?.type,
          message: log.error_message || undefined,
          errorKey: undefined,
          scanned_at: log.scanned_at,
          first_used_at: log.pass?.first_used_at,
        }));

        setScanHistory(history);

        // Calculate stats from history
        const calculatedStats = computeStats(history);
        setStats(calculatedStats);
        persistHistory(history);
      }
    } catch (err) {
      console.error('Error loading scan history:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
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

      const response = await fetch('/api/event/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (data.events) {
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

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setFeedback(null);
      scannerEngine.current.reset();
      console.log('📷 [1/5] Starting camera via user interaction...');

      // ✅ Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // ✅ High resolution for better QR detection
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      console.log('📷 [2/5] Requesting camera with constraints:', constraints);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: any) {
        // ✅ Retry with basic constraints on OverconstrainedError
        if (constraintErr.name === 'OverconstrainedError') {
          console.log('⚠️ OverconstrainedError, retrying with basic constraints...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        } else {
          throw constraintErr;
        }
      }
      
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('📷 [3/5] Camera acquired:', {
        width: settings.width,
        height: settings.height,
        facingMode: settings.facingMode,
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // ✅ Required attributes for iPhone/Safari
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        // ✅ Wait for loadedmetadata before starting
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            console.log('📷 [4/5] Video metadata loaded:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
            });
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            console.error('❌ Video error event');
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video error'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Timeout waiting for video metadata'));
          }, 10000);
        });

        // ✅ Verify video dimensions are not 0
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error('❌ Video dimensions are 0:', { width: video.videoWidth, height: video.videoHeight });
          throw new Error('Video dimensions are 0 - camera may not be working properly');
        }

        await video.play();
        console.log('📷 [5/5] Video playing, starting scan loop...');
        
        setCameraReady(true);
        setScanning(true);
        isScannningRef.current = true;
        startScanLoop();
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err.name, err.message);
      
      let errorMessage = t('EVENT_CAMERA_ERROR') || 'Camera error';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = t('EVENT_CAMERA_PERMISSION') || 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = t('EVENT_NO_CAMERA') || 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = t('EVENT_CAMERA_IN_USE') || 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = t('EVENT_CAMERA_UNSUPPORTED') || 'Camera does not support required settings.';
      } else if (err.message?.includes('dimensions')) {
        errorMessage = t('EVENT_CAMERA_NOT_READY') || 'Camera is not ready. Please try again.';
      }
      
      setCameraError(errorMessage);
      setCameraReady(false);
      setScanning(false);
      isScannningRef.current = false;
    }
  }, [facingMode, t]);

  const stopCamera = useCallback(() => {
    console.log('📷 Stopping camera...');
    isScannningRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setCameraReady(false);
    setProcessing(false);
    setLastScanResult(null);
    setFeedback(null);
    scannerEngine.current.reset();
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 500);
  }, [stopCamera, startCamera]);

  const startScanLoop = useCallback(() => {
    const scanFrame = () => {
      if (!isScannningRef.current) return;

      if (!processingRef.current && !lastScanResult) {
        performScan();
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [lastScanResult]);

  const performScan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    (ctx as any).imageSmoothingEnabled = false;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // ✅ Use FULL frame for maximum detection capability
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw full frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
    setScanCount(prev => prev + 1);

    // Use scanner engine for intelligent detection with feedback
    const result = scannerEngine.current.scan(imageData, videoWidth, videoHeight);
    
    // Update feedback UI
    setFeedback(result.feedback);

    // Process successful scan
    if (result.success && result.data) {
      console.log('✅ QR Code detected!', result.data.substring(0, 50) + '...');
      processQRCode(result.data);
    }
  }, []);

  const processQRCode = async (qrPayload: string) => {
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      setProcessing(true);
      
      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/event/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_raw_value: qrPayload, // ✅ Fixed: API expects qr_raw_value not qr_payload
          event_id: selectedEventId,
          gate_id: selectedGateId || undefined,
          user_id: session.user?.id,
        }),
      });

      const data = await response.json();
      
      // Translate message if errorKey is provided
      let translatedMessage = data.message;
      if (data.errorKey && data.message) {
        translatedMessage = t(data.errorKey) || data.message;
      }
      
      const scanResultData: ScanResultData = {
        result: data.result || 'invalid',
        guest_name: data.guest?.full_name,
        guest_type: data.guest?.type,
        message: translatedMessage,
        errorKey: data.errorKey,
        scanned_at: new Date().toISOString(),
        first_used_at: data.pass?.first_used_at,
      };

      setLastScanResult(scanResultData);
      // Add to history (keep last 50) and persist
      setScanHistory(prev => {
        const next = [scanResultData, ...prev.slice(0, 49)];
        setStats(computeStats(next));
        persistHistory(next);
        return next;
      });

      // Play sound and vibrate
      playSound(data.result);
      vibrate(data.result);

      // Clear result after 2.5 seconds
      setTimeout(() => {
        setLastScanResult(null);
        scannerEngine.current.reset();  // Allow re-scanning
      }, 2500);

    } catch (err: any) {
      console.error('Error processing QR:', err);
      const errorResult: ScanResultData = {
        result: 'invalid',
        message: err.message,
        scanned_at: new Date().toISOString(),
      };
      setLastScanResult(errorResult);
      setScanHistory(prev => {
        const next = [errorResult, ...prev.slice(0, 49)];
        setStats(computeStats(next));
        persistHistory(next);
        return next;
      });
      playSound('invalid');
      vibrate('invalid');
      
      setTimeout(() => setLastScanResult(null), 2500);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Processing uploaded image...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        (ctx as any).imageSmoothingEnabled = false;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Use scanner engine for intelligent detection
        const result = scannerEngine.current.scan(imageData, img.width, img.height);

        if (result.success && result.data) {
          console.log('✅ QR found in image');
          processQRCode(result.data);
        } else {
          console.log('❌ No QR in image');
          setLastScanResult({
            result: 'invalid',
            message: t('EVENT_NO_QR_IN_IMAGE') || 'No QR code found in image',
            scanned_at: new Date().toISOString(),
          });
          playSound('invalid');
          setTimeout(() => setLastScanResult(null), 2500);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  }, [t, selectedEventId, selectedGateId]);

  const playSound = (result: ScanResult) => {
    if (!soundEnabled || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (result === 'valid') {
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
      } else if (result === 'already_used') {
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } else {
        oscillator.frequency.setValueAtTime(349.23, ctx.currentTime);
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.35);
      }
    } catch (err) {
      console.log('Audio error:', err);
    }
  };

  const vibrate = (result: ScanResult) => {
    if (!('vibrate' in navigator)) return;
    try {
      if (result === 'valid') navigator.vibrate(200);
      else if (result === 'already_used') navigator.vibrate([100, 50, 100]);
      else navigator.vibrate([100, 50, 100, 50, 100]);
    } catch (err) {}
  };

  const getResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'from-emerald-500 to-green-600';
      case 'already_used': return 'from-amber-500 to-orange-600';
      default: return 'from-red-500 to-rose-600';
    }
  };

  const getResultBgColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'bg-emerald-500';
      case 'already_used': return 'bg-amber-500';
      default: return 'bg-red-500';
    }
  };

  const getResultIcon = (result: ScanResult) => {
    switch (result) {
      case 'valid': return <CheckCircle className="h-16 w-16 text-white" />;
      case 'already_used': return <AlertTriangle className="h-16 w-16 text-white" />;
      default: return <XCircle className="h-16 w-16 text-white" />;
    }
  };

  const getResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid': return t('EVENT_SCAN_RESULT_VALID') || 'Valid';
      case 'already_used': return t('EVENT_SCAN_RESULT_ALREADY_USED') || 'Already Used';
      case 'invalid': return t('EVENT_SCAN_RESULT_INVALID') || 'Invalid';
      case 'expired': return t('EVENT_SCAN_RESULT_EXPIRED') || 'Expired';
      case 'not_allowed_zone': return t('EVENT_SCAN_RESULT_NOT_ALLOWED_ZONE') || 'Not Allowed';
      case 'revoked': return t('EVENT_SCAN_RESULT_REVOKED') || 'Revoked';
      default: return result;
    }
  };

  const getFeedbackIconComponent = (status: ScanStatus) => {
    switch (status) {
      case 'detected': return CheckCircle;
      case 'too_far': return ArrowDown;
      case 'too_close': return ArrowUp;
      case 'blurry': return Target;
      case 'low_contrast': return Sun;
      case 'partial': return Move;
      default: return QrCode;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6 text-emerald-500" />
            {t('EVENT_SCANNER_TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('EVENT_SCANNER_DESC')}</p>
        </div>
        
        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 bg-card/50 rounded-xl px-4 py-2 border border-border/50">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_TOTAL') || 'Total'}</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-500">{stats.valid}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_VALID') || 'Valid'}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-500">{stats.already_used}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_USED') || 'Used'}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-500">{stats.invalid}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_INVALID') || 'Invalid'}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive flex items-center gap-2">
          <XCircle className="h-5 w-5 flex-shrink-0" />
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
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
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
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              disabled={scanning}
            >
              <option value="">{t('EVENT_SCANNER_ALL_GATES') || 'All Gates'}</option>
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>{gate.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
      <div className="flex flex-wrap gap-3">
        {!scanning ? (
          <Button 
            onClick={startCamera} 
            disabled={!selectedEventId}
            className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Camera className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('EVENT_SCANNER_START')}
          </Button>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="destructive"
            className="flex-1 h-12"
          >
            <CameraOff className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('EVENT_SCANNER_STOP')}
          </Button>
        )}

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="h-12 px-4"
          disabled={!selectedEventId}
        >
          <Upload className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('CHECKIN_UPLOAD_IMAGE') || 'Upload'}
        </Button>

        {scanning && (
          <Button
            onClick={switchCamera}
            variant="outline"
            className="h-12 px-4"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
        )}

        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          className={`h-12 px-4 ${soundEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-border/50">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
            <div>
              <CameraOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-2">{t('EVENT_CAMERA_ERROR_TITLE') || 'Camera Error'}</p>
              <p className="text-muted-foreground text-sm mb-4">{cameraError}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startCamera} size="sm">
                  <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_RETRY') || 'Retry'}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_UPLOAD_IMAGE') || 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        ) : !scanning ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-10 w-10 text-white" />
              </div>
              <p className="text-foreground font-medium">{t('EVENT_SCANNER_READY') || 'Ready to scan'}</p>
              <p className="text-muted-foreground text-sm mt-1">{t('EVENT_SCANNER_SELECT_EVENT_FIRST') || 'Select an event to start'}</p>
            </div>
          </div>
        ) : null}

        {/* ✅ Video Element with playsInline for iPhone */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!scanning ? 'hidden' : ''}`}
          playsInline  // ✅ Required for iPhone
          muted
          autoPlay
          webkit-playsinline="true"  // ✅ Legacy Safari support
        />

        {/* Scan Frame Overlay with Real-time Feedback */}
        {scanning && !lastScanResult && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/40" />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: '70%', height: '70%', maxWidth: '320px', maxHeight: '320px' }}
            >
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
              
              {/* Dynamic corner colors based on feedback */}
              {(() => {
                const cornerColor = feedback?.status === 'detected' 
                  ? 'border-emerald-400' 
                  : feedback?.status === 'too_far' || feedback?.status === 'too_close'
                    ? 'border-amber-400'
                    : feedback?.status === 'blurry' || feedback?.status === 'partial' || feedback?.status === 'low_contrast'
                      ? 'border-orange-400'
                      : 'border-emerald-500';
                return (
                  <>
                    <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${cornerColor} rounded-tl-2xl transition-colors duration-200`} />
                    <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${cornerColor} rounded-tr-2xl transition-colors duration-200`} />
                    <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${cornerColor} rounded-bl-2xl transition-colors duration-200`} />
                    <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${cornerColor} rounded-br-2xl transition-colors duration-200`} />
                  </>
                );
              })()}
              
              <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-scan" />
            </div>
            
            {/* Real-time Feedback Indicator */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              {feedback && feedback.status !== 'scanning' && feedback.status !== 'idle' ? (
                <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-sm border transition-all duration-300 ${
                  feedback.status === 'detected' 
                    ? 'bg-emerald-500/90 border-emerald-400 text-white' 
                    : feedback.status === 'too_far' || feedback.status === 'too_close'
                      ? 'bg-amber-500/90 border-amber-400 text-white'
                      : 'bg-orange-500/90 border-orange-400 text-white'
                }`}>
                  {(() => {
                    const IconComponent = getFeedbackIconComponent(feedback.status);
                    return <IconComponent className="h-5 w-5" />;
                  })()}
                  <span className="font-medium text-sm">
                    {isRTL ? feedback.messageAr : feedback.message}
                  </span>
                </div>
              ) : (
                <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm">{t('CHECKIN_SCANNING') || 'Scanning...'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {lastScanResult && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getResultColor(lastScanResult.result)}`}>
            <div className="text-center text-white p-6">
              {getResultIcon(lastScanResult.result)}
              <p className="text-2xl font-bold mt-4">{getResultLabel(lastScanResult.result)}</p>
              {lastScanResult.guest_name && (
                <div className="mt-4 space-y-1">
                  <p className="text-xl flex items-center justify-center gap-2">
                    <User className="h-5 w-5" />
                    {lastScanResult.guest_name}
                  </p>
                  {lastScanResult.guest_type && (
                    <p className="text-white/80 flex items-center justify-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {lastScanResult.guest_type}
                    </p>
                  )}
                </div>
              )}
              {lastScanResult.result === 'already_used' && lastScanResult.first_used_at && (
                <p className="mt-3 text-white/80 text-sm flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('CHECKIN_FIRST_USED_AT') || 'First used'}: {new Date(lastScanResult.first_used_at).toLocaleTimeString(locale)}
                </p>
              )}
              {lastScanResult.message && (
                <p className="mt-3 text-white/80 text-sm">{lastScanResult.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {processing && !lastScanResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Mobile Stats */}
      <div className="sm:hidden flex items-center justify-around bg-card/50 rounded-xl p-3 border border-border/50">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_TOTAL') || 'Total'}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-emerald-500">{stats.valid}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_VALID') || 'Valid'}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-amber-500">{stats.already_used}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_USED') || 'Used'}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">{stats.invalid}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_INVALID') || 'Invalid'}</div>
        </div>
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold">{t('EVENT_STATS_RECENT_SCANS') || 'Recent Scans'}</h3>
            <span className="text-sm text-muted-foreground">{scanHistory.length} {t('EVENT_SCANS') || 'scans'}</span>
          </div>
          <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div key={index} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getResultBgColor(scan.result)}`} />
                  <div>
                    <p className="font-medium text-foreground">{scan.guest_name || '-'}</p>
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

      {/* Scan Animation Styles */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(calc(100% - 1rem)); opacity: 0.6; }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
