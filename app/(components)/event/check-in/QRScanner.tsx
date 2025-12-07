'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  QrCode,
  Camera,
  CameraOff,
  Settings,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Ticket,
  Clock,
  LogOut,
  Volume2,
  VolumeX,
  RotateCcw,
  Upload,
  SwitchCamera,
  MoveVertical,
  Target,
  Sun,
  Move,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient, clearEventClient } from '@/lib/supabase/event-client';
import type { ScanResult } from '@/lib/event/types';
import { 
  QRScannerEngine, 
  ScanFeedback, 
  ScanStatus,
  getFeedbackColor,
} from '@/lib/event/qr-scanner-engine';

interface QRScannerProps {
  locale: string;
}

interface ScanSession {
  event_id: string;
  event_name?: string;
  gate_id?: string | null;
  gate_name?: string;
}

interface CheckInResult {
  result: ScanResult;
  guest?: {
    full_name: string;
    type: string;
  };
  pass?: {
    id: string;
    first_used_at?: string;
  };
  message?: string;
}

interface ScanStats {
  total: number;
  valid: number;
  already_used: number;
  invalid: number;
}

export function QRScanner({ locale }: QRScannerProps) {
  const router = useRouter();
  const t = useTranslations();
  
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

  // State
  const [session, setSession] = useState<ScanSession | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanCount, setScanCount] = useState(0);

  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<CheckInResult | null>(null);

  // Real-time feedback
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);

  const [stats, setStats] = useState<ScanStats>({
    total: 0,
    valid: 0,
    already_used: 0,
    invalid: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Audio context ref for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load session on mount
  useEffect(() => {
    const storedSession = sessionStorage.getItem('check_in_session') || sessionStorage.getItem('gate_session');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    } else {
      router.push(`/${locale}/event/check-in`);
      return;
    }

    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [locale, router]);

  // ==========================================
  // START CAMERA
  // ==========================================
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setFeedback(null);
      scannerEngine.current.reset();
      console.log('📷 [1/5] Starting camera via user interaction...');

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // High resolution for better QR detection
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
        if (constraintErr.name === 'OverconstrainedError') {
          console.log('⚠️ Retrying with basic constraints...');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode }, 
            audio: false 
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
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        
        // Wait for loadedmetadata before starting
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            console.log('📷 [4/5] Video metadata loaded:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
            });
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video error'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Timeout waiting for video metadata'));
          }, 10000);
        });

        // Verify video dimensions are not 0
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Video dimensions are 0');
        }

        await video.play();
        console.log('📷 [5/5] Video playing, starting scan loop...');
        
        setCameraReady(true);
        setScanning(true);
        isScannningRef.current = true;
        
        // Start high-performance scanning loop
        startScanLoop();
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      
      let errorMessage = t('CHECKIN_CAMERA_ERROR');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = t('CHECKIN_CAMERA_PERMISSION_DENIED');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = t('CHECKIN_NO_CAMERA');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = t('CHECKIN_CAMERA_IN_USE') || 'Camera is in use by another application';
      }
      
      setCameraError(errorMessage);
      setCameraReady(false);
      setScanning(false);
      isScannningRef.current = false;
    }
  }, [facingMode, t]);

  // ==========================================
  // STOP CAMERA
  // ==========================================
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    isScannningRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setScanning(false);
    setFeedback(null);
    scannerEngine.current.reset();
  }, []);

  // ==========================================
  // SWITCH CAMERA
  // ==========================================
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (scanning) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  }, [facingMode, scanning, stopCamera, startCamera]);

  // ==========================================
  // HIGH-PERFORMANCE SCAN LOOP
  // ==========================================
  const startScanLoop = useCallback(() => {
    console.log('🔄 Starting high-performance scan loop...');
    
    const scanFrame = () => {
      if (!isScannningRef.current) {
        console.log('🛑 Scan loop stopped');
        return;
      }

      // Skip if processing or showing result
      if (!processingRef.current && !showResult) {
        performScan();
      }

      // Continue loop at max frame rate
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [showResult]);

  // ==========================================
  // PERFORM SCAN WITH FEEDBACK
  // ==========================================
  const performScan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // ✅ Use FULL frame for maximum detection capability
    // QR codes can be anywhere in the frame
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw full frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

    // Update scan count
    setScanCount(prev => prev + 1);

    // Use scanner engine for intelligent feedback
    const result = scannerEngine.current.scan(imageData, videoWidth, videoHeight);
    
    // Update feedback UI
    setFeedback(result.feedback);

    // Process successful scan
    if (result.success && result.data) {
      processQR(result.data);
    }
  }, []);

  // ==========================================
  // HANDLE FILE INPUT
  // ==========================================
  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Processing uploaded image...');
    setProcessing(true);
    processingRef.current = true;

    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Cannot get canvas context');

      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result = scannerEngine.current.scan(imageData, canvas.width, canvas.height);

      URL.revokeObjectURL(imageUrl);

      if (result.success && result.data) {
        console.log('✅ QR Code found in image');
        await processQR(result.data);
      } else {
        console.log('❌ No QR code found in image');
        setCurrentResult({
          result: 'invalid',
          message: t('CHECKIN_NO_QR_IN_IMAGE') || 'No QR code found in image',
        });
        setShowResult(true);
        playSound('invalid');
        vibrate('invalid');

        setTimeout(() => {
          setShowResult(false);
          setCurrentResult(null);
        }, 2500);
      }
    } catch (err) {
      console.error('❌ Error processing image:', err);
    } finally {
      setProcessing(false);
      processingRef.current = false;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [t]);

  // ==========================================
  // PROCESS QR CODE
  // ==========================================
  const processQR = async (payload: string) => {
    if (processingRef.current || !session) return;

    console.log('🔄 Processing QR code...');
    setProcessing(true);
    processingRef.current = true;

    try {
      const supabase = createEventClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authSession?.access_token) {
        headers['Authorization'] = `Bearer ${authSession.access_token}`;
      }

      const response = await fetch('/api/event/check-in', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          qr_raw_value: payload,
          event_id: session.event_id,
          gate_id: session.gate_id,
          user_id: authSession?.user?.id,
        }),
      });

      const data: CheckInResult = await response.json();
      console.log('✅ Check-in result:', data.result);

      // Update stats
      setStats((prev) => ({
        total: prev.total + 1,
        valid: prev.valid + (data.result === 'valid' ? 1 : 0),
        already_used: prev.already_used + (data.result === 'already_used' ? 1 : 0),
        invalid: prev.invalid + (['invalid', 'expired', 'revoked', 'not_allowed_zone'].includes(data.result) ? 1 : 0),
      }));

      // Play sound & vibrate
      playSound(data.result);
      vibrate(data.result);

      // Show result
      setCurrentResult(data);
      setShowResult(true);

      // Auto-hide after 2.5 seconds
      setTimeout(() => {
        setShowResult(false);
        setCurrentResult(null);
        setProcessing(false);
        processingRef.current = false;
        scannerEngine.current.reset();  // Allow re-scanning
      }, 2500);
    } catch (err: any) {
      console.error('❌ Check-in error:', err);
      
      setCurrentResult({
        result: 'invalid',
        message: err.message || t('CHECKIN_ERROR'),
      });
      setShowResult(true);
      playSound('invalid');
      vibrate('invalid');

      setTimeout(() => {
        setShowResult(false);
        setCurrentResult(null);
        setProcessing(false);
        processingRef.current = false;
      }, 2500);
    }
  };

  // ==========================================
  // SOUND & VIBRATION
  // ==========================================
  const playSound = (result: ScanResult) => {
    if (!soundEnabled || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

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
      console.log('Audio playback error:', err);
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

  // ==========================================
  // NAVIGATION
  // ==========================================
  const handleLogout = async () => {
    stopCamera();
    const supabase = createEventClient();
    await supabase.auth.signOut();
    clearEventClient();
    sessionStorage.removeItem('check_in_session');
    sessionStorage.removeItem('gate_session');
    router.push(`/${locale}/event/check-in`);
  };

  const handleChangeEvent = () => {
    stopCamera();
    sessionStorage.removeItem('check_in_session');
    router.push(`/${locale}/event/check-in/select`);
  };

  // ==========================================
  // UI HELPERS
  // ==========================================
  const getResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'from-emerald-500 to-green-600';
      case 'already_used': return 'from-amber-500 to-orange-600';
      default: return 'from-red-500 to-rose-600';
    }
  };

  const getResultIcon = (result: ScanResult) => {
    switch (result) {
      case 'valid': return <CheckCircle className="h-24 w-24 text-white" />;
      case 'already_used': return <AlertTriangle className="h-24 w-24 text-white" />;
      default: return <XCircle className="h-24 w-24 text-white" />;
    }
  };

  const getResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid': return t('CHECKIN_RESULT_VALID');
      case 'already_used': return t('CHECKIN_RESULT_ALREADY_USED');
      case 'invalid': return t('CHECKIN_RESULT_INVALID');
      case 'expired': return t('CHECKIN_RESULT_EXPIRED');
      case 'revoked': return t('CHECKIN_RESULT_REVOKED');
      case 'not_allowed_zone': return t('CHECKIN_RESULT_NOT_ALLOWED');
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

  const isRTL = locale === 'ar';
  
  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="fixed top-16 inset-x-0 bottom-0 bg-background flex flex-col z-40" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Stats Bar */}
      <div className="bg-card/95 backdrop-blur-xl p-3 flex items-center justify-between z-20 border-b border-border/50 safe-area-top">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_TOTAL')}</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.valid}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_VALID')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-amber-400">{stats.already_used}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_USED')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.invalid}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{t('CHECKIN_STATS_INVALID')}</div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Event Info Bar */}
      {session && (
        <div className="bg-card/80 backdrop-blur px-4 py-2 flex items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <QrCode className="h-4 w-4 text-emerald-500" />
            <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">{session.event_name}</span>
            {session.gate_name && (
              <>
                <span className="text-border">•</span>
                <span className="text-muted-foreground truncate max-w-[80px] sm:max-w-none">{session.gate_name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Camera Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background p-6 z-10">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <CameraOff className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium text-lg mb-2">{t('CHECKIN_CAMERA_ERROR_TITLE')}</p>
              <p className="text-muted-foreground text-sm mb-2">{cameraError}</p>
              <p className="text-muted-foreground/70 text-xs mb-6">
                {t('CHECKIN_USE_UPLOAD_INSTEAD') || 'You can upload a QR code image instead'}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Upload className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_UPLOAD_IMAGE') || 'Upload QR Image'}
                </Button>
                
                <Button onClick={startCamera} variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted">
                  <RotateCcw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_RETRY')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Not Started State */}
        {!cameraError && !scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
            </div>
            
            <div className="text-center max-w-sm px-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-2">{t('CHECKIN_TAP_TO_START') || 'Tap to start scanning'}</p>
              <p className="text-muted-foreground text-sm mb-8">
                {t('CHECKIN_CAMERA_HINT') || 'Point your camera at a QR code to check in guests'}
              </p>
              
              <div className="space-y-4">
                <Button onClick={startCamera} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-14 text-lg shadow-lg shadow-emerald-500/20">
                  <Camera className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_START_CAMERA')}
                </Button>
                
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-muted-foreground text-sm">{t('CHECKIN_OR') || 'OR'}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  className="w-full h-12 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Upload className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('CHECKIN_UPLOAD_IMAGE') || 'Upload QR Image'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!scanning ? 'hidden' : ''}`}
          playsInline
          muted
          autoPlay
          webkit-playsinline="true"
        />

        {/* Scan Frame Overlay with Real-time Feedback */}
        {scanning && !showResult && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Scanning area */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: '80%', height: '80%', maxWidth: '350px', maxHeight: '350px' }}
            >
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              
              {/* Corner markers with dynamic color based on feedback */}
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
                    <div className={`absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 ${cornerColor} rounded-tl-2xl transition-colors duration-200`} />
                    <div className={`absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 ${cornerColor} rounded-tr-2xl transition-colors duration-200`} />
                    <div className={`absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 ${cornerColor} rounded-bl-2xl transition-colors duration-200`} />
                    <div className={`absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 ${cornerColor} rounded-br-2xl transition-colors duration-200`} />
                  </>
                );
              })()}
              
              {/* Animated scan line */}
              <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-scan" />
            </div>
            
            {/* Real-time Feedback Indicator */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              {feedback && feedback.status !== 'scanning' && feedback.status !== 'idle' ? (
                <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-sm border transition-all duration-300 ${
                  feedback.status === 'detected' 
                    ? 'bg-emerald-500/90 border-emerald-400 text-white' 
                    : feedback.status === 'too_far' || feedback.status === 'too_close'
                      ? 'bg-amber-500/90 border-amber-400 text-white'
                      : 'bg-orange-500/90 border-orange-400 text-white'
                }`}>
                  {(() => {
                    const IconComponent = getFeedbackIconComponent(feedback.status);
                    return <IconComponent className="h-6 w-6" />;
                  })()}
                  <span className="font-semibold text-base">
                    {isRTL ? feedback.messageAr : feedback.message}
                  </span>
                </div>
              ) : (
                <div className="bg-black/80 backdrop-blur-sm px-5 py-2.5 rounded-full flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">{t('CHECKIN_SCANNING') || 'Scanning...'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {showResult && currentResult && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getResultColor(currentResult.result)} z-20`}>
            <div className="text-center text-white p-6 animate-scale-in">
              {getResultIcon(currentResult.result)}
              <h2 className="text-3xl font-bold mt-4">{getResultLabel(currentResult.result)}</h2>

              {currentResult.guest && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xl">
                    <User className="h-6 w-6" />
                    <span>{currentResult.guest.full_name}</span>
                  </div>
                  {currentResult.guest.type && (
                    <div className="flex items-center justify-center gap-2 text-white/80">
                      <Ticket className="h-5 w-5" />
                      <span>{currentResult.guest.type}</span>
                    </div>
                  )}
                </div>
              )}

              {currentResult.result === 'already_used' && currentResult.pass?.first_used_at && (
                <div className="mt-4 flex items-center justify-center gap-2 text-white/80">
                  <Clock className="h-5 w-5" />
                  <span>
                    {t('CHECKIN_FIRST_USED_AT')}: {new Date(currentResult.pass.first_used_at).toLocaleTimeString(locale)}
                  </span>
                </div>
              )}

              {currentResult.message && (
                <p className="mt-4 text-white/80 text-sm">{currentResult.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {processing && !showResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-15">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-card/95 backdrop-blur-xl p-4 flex items-center justify-center gap-3 border-t border-border/50 safe-area-bottom">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl transition-colors ${
            soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>

        {scanning && (
          <button
            onClick={switchCamera}
            className="p-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={t('CHECKIN_SWITCH_CAMERA') || 'Switch Camera'}
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-colors shadow-lg shadow-emerald-500/20"
          title={t('CHECKIN_UPLOAD_IMAGE') || 'Upload QR Image'}
        >
          <Upload className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">{t('CHECKIN_UPLOAD_IMAGE') || 'Upload'}</span>
        </button>

        {scanning && (
          <button
            onClick={stopCamera}
            className="p-3 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            <CameraOff className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:w-96 max-h-[80vh] overflow-auto safe-area-bottom border border-border/50">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="text-lg font-semibold text-foreground">{t('CHECKIN_SETTINGS')}</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {session && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">{t('CHECKIN_CURRENT_EVENT')}</div>
                  <div className="text-foreground font-medium">{session.event_name}</div>
                  {session.gate_name && (
                    <>
                      <div className="text-sm text-muted-foreground mt-2">{t('CHECKIN_CURRENT_GATE')}</div>
                      <div className="text-foreground font-medium">{session.gate_name}</div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleChangeEvent}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors"
                >
                  <QrCode className="h-5 w-5 text-emerald-500" />
                  <span>{t('CHECKIN_CHANGE_EVENT')}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('CHECKIN_LOGOUT')}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-border/50">
                <button
                  onClick={() => setStats({ total: 0, valid: 0, already_used: 0, invalid: 0 })}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('CHECKIN_RESET_STATS')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(calc(100% - 1rem)); opacity: 0.6; }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
