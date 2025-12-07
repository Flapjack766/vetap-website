'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
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
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>('');
  const processingRef = useRef(false);

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
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  // Audio refs
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const warningSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);

  // Load session and initialize
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
    }

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const cameraList = devices.map((device) => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`,
          }));
          setCameras(cameraList);
          // Prefer back camera
          const backCamera = cameraList.find(
            (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || cameraList[0].id);
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setCameraError(t('CHECKIN_NO_CAMERA'));
      });

    return () => {
      stopScanning();
    };
  }, [locale, router, t]);

  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      setCameraError(t('CHECKIN_NO_CAMERA'));
      return;
    }

    try {
      setCameraError(null);
      
      // Create scanner instance if not exists
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader', {
          verbose: false,
        });
      }

      const scanner = html5QrCodeRef.current;

      // Start scanning
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanFailure
      );

      setCameraReady(true);
      setScanning(true);
      console.log('Scanner started successfully');
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setCameraError(
        err.message?.includes('Permission')
          ? t('CHECKIN_CAMERA_PERMISSION_DENIED')
          : err.message?.includes('NotFound')
          ? t('CHECKIN_NO_CAMERA')
          : `${t('CHECKIN_CAMERA_ERROR')}: ${err.message}`
      );
      setCameraReady(false);
      setScanning(false);
    }
  }, [selectedCamera, t]);

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setCameraReady(false);
    setScanning(false);
  }, []);

  // Called when QR code is successfully scanned
  const onScanSuccess = useCallback((decodedText: string) => {
    // Prevent duplicate scans and processing
    if (processingRef.current || decodedText === lastScanRef.current) {
      return;
    }

    console.log('QR Code detected:', decodedText.substring(0, 50) + '...');
    lastScanRef.current = decodedText;
    processQR(decodedText);
  }, []);

  // Called on each frame when no QR is detected (we ignore this)
  const onScanFailure = useCallback((errorMessage: string) => {
    // Silently ignore - this is called frequently when no QR is in view
  }, []);

  const processQR = async (payload: string) => {
    if (processingRef.current || !session) return;

    console.log('Processing QR code...');
    processingRef.current = true;
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
      console.log('Check-in result:', data.result);

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

      // Auto-hide after 2.5 seconds
      setTimeout(() => {
        setShowResult(false);
        setCurrentResult(null);
        lastScanRef.current = '';
        processingRef.current = false;
        setProcessing(false);
      }, 2500);
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
        processingRef.current = false;
        setProcessing(false);
      }, 2500);
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
    await stopScanning();
    const supabase = createEventClient();
    await supabase.auth.signOut();
    clearEventClient();
    sessionStorage.removeItem('check_in_session');
    sessionStorage.removeItem('gate_session');
    router.push(`/${locale}/event/check-in`);
  };

  const handleChangeEvent = async () => {
    await stopScanning();
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
      <div className="flex-1 relative overflow-hidden bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 z-10">
            <div className="text-center">
              <CameraOff className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{t('CHECKIN_CAMERA_ERROR_TITLE')}</p>
              <p className="text-slate-400 text-sm mb-6">{cameraError}</p>
              <Button onClick={startScanning} className="bg-emerald-500 hover:bg-emerald-600">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('CHECKIN_RETRY')}
              </Button>
            </div>
          </div>
        ) : !scanning ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <Camera className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <p className="text-white font-medium mb-4">{t('CHECKIN_STARTING_CAMERA')}</p>
              
              {cameras.length > 1 && (
                <div className="mb-4">
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button onClick={startScanning} className="bg-emerald-500 hover:bg-emerald-600">
                <Camera className="h-4 w-4 mr-2" />
                {t('CHECKIN_START_CAMERA')}
              </Button>
            </div>
          </div>
        ) : null}

        {/* QR Scanner Container */}
        <div 
          id="qr-reader" 
          className={`w-full h-full ${!scanning ? 'hidden' : ''}`}
          style={{ minHeight: '300px' }}
        />

        {/* Scanning indicator overlay */}
        {scanning && !showResult && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-black/70 px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-white text-sm">{t('CHECKIN_SCANNING') || 'Scanning...'}</span>
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {showResult && currentResult && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getResultColor(
              currentResult.result
            )} z-20 animate-fade-in`}
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
        {processing && !showResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-15">
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

        {scanning && (
          <button
            onClick={stopScanning}
            className="p-3 rounded-xl bg-red-500/20 text-red-400 transition-colors"
          >
            <CameraOff className="h-6 w-6" />
          </button>
        )}
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

              {/* Camera Selection */}
              {cameras.length > 1 && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">{t('CHECKIN_SELECT_CAMERA') || 'Select Camera'}</div>
                  <select
                    value={selectedCamera}
                    onChange={async (e) => {
                      setSelectedCamera(e.target.value);
                      if (scanning) {
                        await stopScanning();
                        setTimeout(() => startScanning(), 500);
                      }
                    }}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
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

      {/* CSS Styles */}
      <style jsx global>{`
        #qr-reader {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader__scan_region {
          min-height: 100% !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__dashboard_section_csr {
          display: none !important;
        }
        #qr-reader__dashboard_section_swaplink {
          display: none !important;
        }
        #qr-shaded-region {
          border-color: #10b981 !important;
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
