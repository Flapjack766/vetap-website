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
  Flashlight,
  FlashlightOff,
  RotateCcw,
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [session, setSession] = useState<ScanSession | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<CheckInResult | null>(null);

  const [stats, setStats] = useState<ScanStats>({
    total: 0,
    valid: 0,
    already_used: 0,
    invalid: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Audio refs
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const warningSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load session from storage
    const storedSession = sessionStorage.getItem('check_in_session') || sessionStorage.getItem('gate_session');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    } else {
      router.push(`/${locale}/event/check-in`);
      return;
    }

    // Initialize audio (using Web Audio API for better mobile support)
    if (typeof window !== 'undefined') {
      successSoundRef.current = new Audio('/sounds/success.mp3');
      warningSoundRef.current = new Audio('/sounds/warning.mp3');
      errorSoundRef.current = new Audio('/sounds/error.mp3');
    }

    return () => {
      stopCamera();
    };
  }, [locale, router]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setScanning(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? t('CHECKIN_CAMERA_PERMISSION_DENIED')
          : err.name === 'NotFoundError'
          ? t('CHECKIN_NO_CAMERA')
          : t('CHECKIN_CAMERA_ERROR')
      );
      setCameraReady(false);
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (err) {
      console.error('Flash error:', err);
    }
  }, [flashEnabled]);

  const scanFrame = useCallback(() => {
    if (!scanning || processing || showResult) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try BarcodeDetector API first (better performance on supported browsers)
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      barcodeDetector
        .detect(canvas)
        .then((barcodes: any[]) => {
          if (barcodes.length > 0 && !processing && !showResult) {
            const qrData = barcodes[0].rawValue;
            // Prevent duplicate scans
            if (qrData !== lastScanRef.current) {
              lastScanRef.current = qrData;
              processQR(qrData);
            }
          }
        })
        .catch(() => {
          // Fallback to jsQR on error
          scanWithJsQR(context, canvas.width, canvas.height);
        });
    } else {
      // Fallback to jsQR for browsers without BarcodeDetector (Safari, older browsers)
      scanWithJsQR(context, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [scanning, processing, showResult]);

  // Fallback QR scanner using jsQR library
  const scanWithJsQR = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    if (processing || showResult) return;

    try {
      const imageData = context.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // Prevent duplicate scans
        if (code.data !== lastScanRef.current) {
          lastScanRef.current = code.data;
          processQR(code.data);
        }
      }
    } catch (err) {
      console.error('jsQR scan error:', err);
    }
  }, [processing, showResult]);

  const processQR = async (payload: string) => {
    if (processing || !session) return;

    try {
      setProcessing(true);

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

      // Update stats
      setStats((prev) => ({
        total: prev.total + 1,
        valid: prev.valid + (data.result === 'valid' ? 1 : 0),
        already_used: prev.already_used + (data.result === 'already_used' ? 1 : 0),
        invalid: prev.invalid + (['invalid', 'expired', 'revoked', 'not_allowed_zone'].includes(data.result) ? 1 : 0),
      }));

      // Play sound
      playSound(data.result);

      // Vibrate
      vibrate(data.result);

      // Show result
      setCurrentResult(data);
      setShowResult(true);

      // Auto-hide after 2 seconds
      setTimeout(() => {
        setShowResult(false);
        setCurrentResult(null);
        lastScanRef.current = '';
      }, 2000);
    } catch (err: any) {
      console.error('Check-in error:', err);
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
        lastScanRef.current = '';
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const playSound = (result: ScanResult) => {
    if (!soundEnabled) return;

    try {
      if (result === 'valid') {
        successSoundRef.current?.play().catch(() => {});
      } else if (result === 'already_used') {
        warningSoundRef.current?.play().catch(() => {});
      } else {
        errorSoundRef.current?.play().catch(() => {});
      }
    } catch (err) {
      // Ignore audio errors
    }
  };

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

  const getResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid':
        return 'from-emerald-500 to-green-600';
      case 'already_used':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-red-500 to-rose-600';
    }
  };

  const getResultIcon = (result: ScanResult) => {
    switch (result) {
      case 'valid':
        return <CheckCircle className="h-24 w-24 text-white" />;
      case 'already_used':
        return <AlertTriangle className="h-24 w-24 text-white" />;
      default:
        return <XCircle className="h-24 w-24 text-white" />;
    }
  };

  const getResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid':
        return t('CHECKIN_RESULT_VALID');
      case 'already_used':
        return t('CHECKIN_RESULT_ALREADY_USED');
      case 'invalid':
        return t('CHECKIN_RESULT_INVALID');
      case 'expired':
        return t('CHECKIN_RESULT_EXPIRED');
      case 'revoked':
        return t('CHECKIN_RESULT_REVOKED');
      case 'not_allowed_zone':
        return t('CHECKIN_RESULT_NOT_ALLOWED');
      default:
        return result;
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 flex items-center justify-between z-20 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_TOTAL')}</div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.valid}</div>
            <div className="text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_VALID')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.already_used}</div>
            <div className="text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_USED')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
            <div className="text-[10px] text-slate-400 uppercase">{t('CHECKIN_STATS_INVALID')}</div>
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
            <span className="text-white font-medium">{session.event_name}</span>
            {session.gate_name && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{session.gate_name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6">
            <div className="text-center">
              <CameraOff className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{t('CHECKIN_CAMERA_ERROR_TITLE')}</p>
              <p className="text-slate-400 text-sm mb-6">{cameraError}</p>
              <Button onClick={startCamera} className="bg-emerald-500 hover:bg-emerald-600">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('CHECKIN_RETRY')}
              </Button>
            </div>
          </div>
        ) : !cameraReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <Camera className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <p className="text-white font-medium mb-4">{t('CHECKIN_STARTING_CAMERA')}</p>
              <Button onClick={startCamera} className="bg-emerald-500 hover:bg-emerald-600">
                <Camera className="h-4 w-4 mr-2" />
                {t('CHECKIN_START_CAMERA')}
              </Button>
            </div>
          </div>
        ) : null}

        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!cameraReady ? 'hidden' : ''}`}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan Frame Overlay */}
        {cameraReady && !showResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

              {/* Scanning line animation */}
              <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan" />
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {showResult && currentResult && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getResultColor(
              currentResult.result
            )} animate-fade-in`}
          >
            <div className="text-center text-white p-6">
              {getResultIcon(currentResult.result)}
              <h2 className="text-3xl font-bold mt-4">{getResultLabel(currentResult.result)}</h2>

              {currentResult.guest && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xl">
                    <User className="h-6 w-6" />
                    <span>{currentResult.guest.full_name}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-white/80">
                    <Ticket className="h-5 w-5" />
                    <span>{currentResult.guest.type}</span>
                  </div>
                </div>
              )}

              {currentResult.result === 'already_used' && currentResult.pass?.first_used_at && (
                <div className="mt-4 flex items-center justify-center gap-2 text-white/80">
                  <Clock className="h-5 w-5" />
                  <span>
                    {t('CHECKIN_FIRST_USED_AT')}:{' '}
                    {new Date(currentResult.pass.first_used_at).toLocaleTimeString(locale)}
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
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-900 p-4 flex items-center justify-center gap-6 border-t border-slate-700/50">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl transition-colors ${
            soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>

        <button
          onClick={toggleFlash}
          className={`p-3 rounded-xl transition-colors ${
            flashEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {flashEnabled ? <Flashlight className="h-6 w-6" /> : <FlashlightOff className="h-6 w-6" />}
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full sm:w-96 max-h-[80vh] overflow-auto">
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
              {/* Current Session Info */}
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

              {/* Stats Reset */}
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

      {/* Scanning animation CSS */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(240px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

