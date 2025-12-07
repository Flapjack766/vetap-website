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
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [session, setSession] = useState<ScanSession | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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

  // Start camera with getUserMedia - the most reliable method
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      console.log('📷 Starting camera with getUserMedia...');

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access - must be triggered by user interaction
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log('✅ Camera stream acquired');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded');
              resolve();
            };
          }
        });

        await videoRef.current.play();
        console.log('✅ Video playing');
        
        setCameraReady(true);
        setScanning(true);
        
        // Start scanning loop
        startScanningLoop();
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
        // Try again with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await videoRef.current.play();
            setCameraReady(true);
            setScanning(true);
            startScanningLoop();
            return;
          }
        } catch {
          errorMessage = t('CHECKIN_CAMERA_ERROR');
        }
      }
      
      setCameraError(errorMessage);
      setCameraReady(false);
      setScanning(false);
    }
  }, [facingMode, t]);

  // Stop camera
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    // Stop scanning loop
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Track stopped:', track.kind);
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

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (scanning) {
      stopCamera();
      // Small delay to ensure camera is released
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  }, [facingMode, scanning, stopCamera, startCamera]);

  // Scanning loop using jsQR
  const startScanningLoop = useCallback(() => {
    console.log('🔄 Starting scanning loop...');
    
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Scan every 100ms (10 FPS)
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 100);
  }, []);

  // Scan single frame with jsQR
  const scanFrame = useCallback(() => {
    if (processing || showResult) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for jsQR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Decode QR with jsQR
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const now = Date.now();
      
      // Prevent duplicate scans within 3 seconds
      if (code.data === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
        return;
      }

      console.log('✅ QR Code detected:', code.data.substring(0, 50) + '...');
      
      lastScanRef.current = code.data;
      lastScanTimeRef.current = now;
      
      // Draw detection box
      drawDetectionBox(ctx, code.location);
      
      // Process the QR code
      processQR(code.data);
    }
  }, [processing, showResult]);

  // Draw detection box around QR code
  const drawDetectionBox = (ctx: CanvasRenderingContext2D, location: any) => {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    ctx.closePath();
    ctx.stroke();
  };

  // Handle file input (fallback for camera issues)
  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Processing uploaded image...');
    setProcessing(true);

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
      
      const ctx = canvas.getContext('2d');
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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [t]);

  // Process QR code data
  const processQR = async (payload: string) => {
    if (processing || !session) return;

    console.log('🔄 Processing QR code...');
    setProcessing(true);

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
      }, 2500);
    }
  };

  // Play sound based on result
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
    } catch (err) {
      // Ignore audio errors
    }
  };

  // Vibrate based on result
  const vibrate = (result: ScanResult) => {
    if (!('vibrate' in navigator)) return;

    try {
      if (result === 'valid') {
        navigator.vibrate(200);
      } else if (result === 'already_used') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    } catch (err) {
      // Ignore vibration errors
    }
  };

  // Logout
  const handleLogout = async () => {
    stopCamera();
    const supabase = createEventClient();
    await supabase.auth.signOut();
    clearEventClient();
    sessionStorage.removeItem('check_in_session');
    sessionStorage.removeItem('gate_session');
    router.push(`/${locale}/event/check-in`);
  };

  // Change event
  const handleChangeEvent = () => {
    stopCamera();
    sessionStorage.removeItem('check_in_session');
    router.push(`/${locale}/event/check-in/select`);
  };

  // Result UI helpers
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
                <Button onClick={startCamera} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('CHECKIN_RETRY')}
                </Button>
                
                {/* Fallback: Upload Image */}
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
                <Button onClick={startCamera} className="w-full bg-emerald-500 hover:bg-emerald-600 h-14 text-lg">
                  <Camera className="h-5 w-5 mr-2" />
                  {t('CHECKIN_START_CAMERA')}
                </Button>
                
                {/* Fallback: Upload Image */}
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

        {/* Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!scanning ? 'hidden' : ''}`}
          playsInline
          muted
          autoPlay
        />

        {/* Scan Frame Overlay */}
        {scanning && !showResult && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Darkened corners */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Clear scanning area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72">
              {/* Clear the center */}
              <div className="absolute inset-0 bg-black/0" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
              
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan" />
            </div>
            
            {/* Scanning indicator */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">{t('CHECKIN_SCANNING') || 'Scanning...'}</span>
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
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl transition-colors ${
            soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>

        {/* Switch Camera */}
        {scanning && (
          <button
            onClick={switchCamera}
            className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Switch Camera"
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        )}

        {/* Upload Image (Fallback) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Upload Image"
        >
          <Upload className="h-6 w-6" />
        </button>

        {/* Stop Camera */}
        {scanning && (
          <button
            onClick={stopCamera}
            className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Stop Camera"
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
              {/* Current Session */}
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

              {/* Actions */}
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

              {/* Reset Stats */}
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
          50% { transform: translateY(250px); opacity: 0.5; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
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
