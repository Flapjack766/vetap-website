'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import jsQR from 'jsqr';
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
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient, clearEventClient } from '@/lib/supabase/event-client';
import type { ScanResult } from '@/lib/event/types';

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
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
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
  const [scanCount, setScanCount] = useState(0); // Debug: track scan attempts

  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<CheckInResult | null>(null);

  const [stats, setStats] = useState<ScanStats>({
    total: 0,
    valid: 0,
    already_used: 0,
    invalid: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Audio refs
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const warningSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);

  // Load session on mount
  useEffect(() => {
    const storedSession = sessionStorage.getItem('check_in_session') || sessionStorage.getItem('gate_session');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    } else {
      router.push(`/${locale}/event/check-in`);
      return;
    }

    // Initialize audio
    if (typeof window !== 'undefined') {
      successSoundRef.current = new Audio('/sounds/success.mp3');
      warningSoundRef.current = new Audio('/sounds/warning.mp3');
      errorSoundRef.current = new Audio('/sounds/error.mp3');
      
      // Preload audio
      successSoundRef.current.load();
      warningSoundRef.current.load();
      errorSoundRef.current.load();
    }

    return () => {
      stopCamera();
    };
  }, [locale, router]);

  // ==========================================
  // START CAMERA - Triggered by user button click
  // ==========================================
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      console.log('📷 [1/5] Starting camera via user interaction...');

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // ✅ High resolution for better QR detection
      // ✅ facingMode: "environment" for back camera (or { ideal: "environment" })
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      console.log('📷 [2/5] Requesting camera with constraints:', constraints);
      
      // ✅ getUserMedia - must be triggered by user interaction
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('📷 [3/5] Camera acquired:', {
        width: settings.width,
        height: settings.height,
        facingMode: settings.facingMode,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // ✅ Wait for loadedmetadata before starting
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
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
          
          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Timeout waiting for video metadata'));
          }, 10000);
        });

        // ✅ Verify video dimensions are not 0
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
          throw new Error('Video dimensions are 0');
        }

        await videoRef.current.play();
        console.log('📷 [5/5] Video playing, starting scan loop...');
        
        setCameraReady(true);
        setScanning(true);
        isScannningRef.current = true;
        
        // ✅ Start scanning loop with requestAnimationFrame
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
      } else if (err.name === 'OverconstrainedError') {
        // Try with basic constraints
        console.log('⚠️ Retrying with basic constraints...');
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode }, 
            audio: false 
          });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await new Promise<void>((resolve) => {
              videoRef.current!.onloadedmetadata = () => resolve();
            });
            await videoRef.current.play();
            setCameraReady(true);
            setScanning(true);
            isScannningRef.current = true;
            startScanLoop();
            return;
          }
        } catch (retryErr) {
          console.error('❌ Retry failed:', retryErr);
        }
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
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setScanning(false);
  }, []);

  // ==========================================
  // SWITCH CAMERA (front/back)
  // ==========================================
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (scanning) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  }, [facingMode, scanning, stopCamera, startCamera]);

  // ==========================================
  // SCAN LOOP using requestAnimationFrame
  // ==========================================
  const startScanLoop = useCallback(() => {
    console.log('🔄 Starting scan loop with requestAnimationFrame...');
    
    const scanFrame = () => {
      // Check if we should continue scanning
      if (!isScannningRef.current) {
        console.log('🛑 Scan loop stopped');
        return;
      }

      // Skip if processing or showing result
      if (!processingRef.current && !showResult) {
        performScan();
      }

      // ✅ Use requestAnimationFrame for smooth, synchronized scanning
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [showResult]);

  // ==========================================
  // PERFORM SINGLE SCAN with jsQR
  // ==========================================
  const performScan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    
    // ✅ Check video is ready and has valid dimensions
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // ✅ Get context with willReadFrequently for performance
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // ✅ Set canvas dimensions from actual video values
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // ✅ Crop center region only (reduces noise, increases speed)
    // Use 70% of the center for scanning
    const cropRatio = 0.7;
    const cropWidth = Math.floor(videoWidth * cropRatio);
    const cropHeight = Math.floor(videoHeight * cropRatio);
    const cropX = Math.floor((videoWidth - cropWidth) / 2);
    const cropY = Math.floor((videoHeight - cropHeight) / 2);

    // Set canvas to crop size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw only the center region
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source (center crop)
      0, 0, cropWidth, cropHeight            // Destination (full canvas)
    );

    // Get image data
    const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);

    // Update scan count for debugging
    setScanCount(prev => prev + 1);

    // ✅ Decode QR with jsQR - enable inversionAttempts for better detection
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth', // ✅ Try both normal and inverted colors
    });

    if (code && code.data) {
      const now = Date.now();
      
      // Prevent duplicate scans within 3 seconds
      if (code.data === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
        return;
      }

      console.log('✅ QR Code detected!', {
        data: code.data.substring(0, 50) + '...',
        location: code.location,
      });
      
      lastScanRef.current = code.data;
      lastScanTimeRef.current = now;
      
      // Process the QR code
      processQR(code.data);
    }
  }, []);

  // ==========================================
  // HANDLE FILE INPUT (fallback)
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

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      URL.revokeObjectURL(imageUrl);

      if (code && code.data) {
        console.log('✅ QR Code found in image:', code.data.substring(0, 50) + '...');
        await processQR(code.data);
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
        lastScanRef.current = ''; // Allow re-scanning same QR
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
    if (!soundEnabled) return;
    try {
      const audio = result === 'valid' 
        ? successSoundRef.current 
        : result === 'already_used' 
          ? warningSoundRef.current 
          : errorSoundRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch (err) {}
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

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 flex items-center justify-between z-20 border-b border-slate-700/50 safe-area-top">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_TOTAL')}</div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.valid}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_VALID')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-amber-400">{stats.already_used}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_USED')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.invalid}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_INVALID')}</div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Event Info Bar */}
      {session && (
        <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-700/30">
          <div className="flex items-center gap-2 text-sm">
            <QrCode className="h-4 w-4 text-emerald-500" />
            <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none">{session.event_name}</span>
            {session.gate_name && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 truncate max-w-[80px] sm:max-w-none">{session.gate_name}</span>
              </>
            )}
          </div>
          {/* Debug: Show scan count */}
          {scanning && (
            <div className="text-xs text-slate-500">
              Scans: {scanCount}
            </div>
          )}
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Camera Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 z-10">
            <div className="text-center max-w-sm">
              <CameraOff className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{t('CHECKIN_CAMERA_ERROR_TITLE')}</p>
              <p className="text-slate-400 text-sm mb-6">{cameraError}</p>
              
              <div className="space-y-3">
                {/* ✅ Button triggers camera - user interaction required */}
                <Button onClick={startCamera} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('CHECKIN_RETRY')}
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('CHECKIN_UPLOAD_IMAGE') || 'Upload QR Image'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Not Started State */}
        {!cameraError && !scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center max-w-sm px-6">
              <Camera className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{t('CHECKIN_TAP_TO_START') || 'Tap to start scanning'}</p>
              <p className="text-slate-400 text-sm mb-6">
                {t('CHECKIN_CAMERA_HINT') || 'Point your camera at a QR code to check in guests'}
              </p>
              
              <div className="space-y-3">
                {/* ✅ Button triggers camera - user interaction required */}
                <Button onClick={startCamera} className="w-full bg-emerald-500 hover:bg-emerald-600 h-14 text-lg">
                  <Camera className="h-5 w-5 mr-2" />
                  {t('CHECKIN_START_CAMERA')}
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('CHECKIN_UPLOAD_IMAGE') || 'Upload QR Image'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Video Element with playsInline for iPhone */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!scanning ? 'hidden' : ''}`}
          playsInline  // ✅ Required for iPhone
          muted
          autoPlay
          webkit-playsinline="true"  // ✅ Legacy Safari support
        />

        {/* Scan Frame Overlay */}
        {scanning && !showResult && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Darkened area outside scan region */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Clear scanning area (70% center - matches crop ratio) */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: '70%', height: '70%', maxWidth: '320px', maxHeight: '320px' }}
            >
              {/* Cut out the center */}
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-scan" />
            </div>
            
            {/* Scanning indicator */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <div className="bg-black/80 backdrop-blur-sm px-5 py-2.5 rounded-full flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">{t('CHECKIN_SCANNING') || 'Scanning...'}</span>
              </div>
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
      <div className="bg-slate-900 p-4 flex items-center justify-center gap-4 border-t border-slate-700/50 safe-area-bottom">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl transition-colors ${
            soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>

        {scanning && (
          <button
            onClick={switchCamera}
            className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Upload className="h-6 w-6" />
        </button>

        {scanning && (
          <button
            onClick={stopCamera}
            className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <CameraOff className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full sm:w-96 max-h-[80vh] overflow-auto safe-area-bottom">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-white">{t('CHECKIN_SETTINGS')}</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {session && (
                <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                  <div className="text-sm text-slate-400">{t('CHECKIN_CURRENT_EVENT')}</div>
                  <div className="text-white font-medium">{session.event_name}</div>
                  {session.gate_name && (
                    <>
                      <div className="text-sm text-slate-400 mt-2">{t('CHECKIN_CURRENT_GATE')}</div>
                      <div className="text-white font-medium">{session.gate_name}</div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleChangeEvent}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 text-white hover:bg-slate-800 transition-colors"
                >
                  <QrCode className="h-5 w-5 text-emerald-500" />
                  <span>{t('CHECKIN_CHANGE_EVENT')}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('CHECKIN_LOGOUT')}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => setStats({ total: 0, valid: 0, already_used: 0, invalid: 0 })}
                  className="w-full py-3 text-sm text-slate-500 hover:text-white transition-colors"
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
