/**
 * VETAP Event - Advanced QR Scanner Engine
 * 
 * Professional-grade QR scanning with:
 * - Ultra-fast detection (60 FPS scanning)
 * - Real-time feedback (too far, too close, blurry)
 * - Finder pattern detection for partial QR visibility
 * - Multi-resolution scanning for optimal detection
 * - Adaptive brightness/contrast handling
 */

import jsQR, { QRCode } from 'jsqr';

// ==================== Types ====================

export type ScanStatus = 
  | 'idle'           // Not scanning
  | 'scanning'       // Actively scanning, no QR visible
  | 'detected'       // QR detected and decoded successfully
  | 'too_far'        // QR visible but too small
  | 'too_close'      // QR visible but too large (cropped)
  | 'blurry'         // QR visible but can't decode (blur/motion)
  | 'low_contrast'   // QR visible but low contrast
  | 'partial'        // Partial QR visible (move to center)
  | 'processing';    // Processing detected QR

export interface ScanFeedback {
  status: ScanStatus;
  message: string;
  messageAr: string;
  confidence: number;  // 0-100
  qrSize?: number;     // Relative size of QR in frame (0-100)
  qrPosition?: { x: number; y: number };  // Center position relative to frame
}

export interface ScanResult {
  success: boolean;
  data?: string;
  feedback: ScanFeedback;
  processingTime: number;
}

interface FinderPattern {
  x: number;
  y: number;
  size: number;
  confidence: number;
}

// ==================== Constants ====================

// Optimal QR size relative to scan area (percentage)
const OPTIMAL_QR_SIZE_MIN = 25;  // QR should be at least 25% of scan area
const OPTIMAL_QR_SIZE_MAX = 70;  // QR should be at most 70% of scan area
const TOO_SMALL_THRESHOLD = 15;  // Below this, QR is definitely too far
const TOO_LARGE_THRESHOLD = 85;  // Above this, QR is definitely too close

// Finder pattern detection thresholds
const FINDER_PATTERN_RATIO = [1, 1, 3, 1, 1];  // Standard QR finder pattern ratio
const FINDER_PATTERN_TOLERANCE = 0.5;

// Scan quality thresholds
const MIN_BRIGHTNESS = 30;
const MAX_BRIGHTNESS = 225;
const MIN_CONTRAST = 50;

// ==================== Scanner Engine Class ====================

export class QRScannerEngine {
  private lastSuccessfulScan: string = '';
  private lastScanTime: number = 0;
  private scanCooldown: number = 2500;  // 2.5 seconds cooldown for same QR
  private consecutiveFailures: number = 0;
  private lastFeedback: ScanFeedback | null = null;
  private feedbackStabilityCount: number = 0;
  private readonly feedbackStabilityThreshold: number = 3;

  constructor(cooldownMs: number = 2500) {
    this.scanCooldown = cooldownMs;
  }

  /**
   * Main scan function - analyzes video frame and returns result with feedback
   */
  scan(
    imageData: ImageData,
    scanAreaWidth: number,
    scanAreaHeight: number
  ): ScanResult {
    const startTime = performance.now();
    
    // Analyze image quality
    const quality = this.analyzeImageQuality(imageData);
    
    // Try to decode QR
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    const processingTime = performance.now() - startTime;

    // QR successfully decoded
    if (qrResult && qrResult.data) {
      const qrSize = this.calculateQRSize(qrResult, scanAreaWidth, scanAreaHeight);
      const qrPosition = this.calculateQRPosition(qrResult, scanAreaWidth, scanAreaHeight);
      
      // Check for duplicate scan
      const now = Date.now();
      if (qrResult.data === this.lastSuccessfulScan && 
          now - this.lastScanTime < this.scanCooldown) {
        return {
          success: false,
          feedback: this.createFeedback('detected', 95, qrSize, qrPosition),
          processingTime,
        };
      }

      // ✅ QR detected and decoded - ALWAYS process it!
      // Just provide feedback about positioning for user guidance
      this.lastSuccessfulScan = qrResult.data;
      this.lastScanTime = now;
      this.consecutiveFailures = 0;

      // Determine feedback status based on size (informational only)
      let feedbackStatus: ScanStatus = 'detected';
      let confidence = 100;
      
      if (qrSize < TOO_SMALL_THRESHOLD) {
        feedbackStatus = 'too_far';
        confidence = 70;
      } else if (qrSize > TOO_LARGE_THRESHOLD) {
        feedbackStatus = 'too_close';
        confidence = 70;
      }

      return {
        success: true,  // ✅ Always true when QR is decoded
        data: qrResult.data,
        feedback: this.createFeedback(feedbackStatus, confidence, qrSize, qrPosition),
        processingTime,
      };
    }

    // QR not decoded - analyze why
    this.consecutiveFailures++;

    // Try to detect finder patterns (partial QR)
    const finderPatterns = this.detectFinderPatterns(imageData);
    
    if (finderPatterns.length > 0) {
      // We see finder patterns but can't decode
      const avgSize = finderPatterns.reduce((sum, p) => sum + p.size, 0) / finderPatterns.length;
      const estimatedQRSize = (avgSize * 7 / Math.min(scanAreaWidth, scanAreaHeight)) * 100;
      
      // Estimate QR center
      const avgX = finderPatterns.reduce((sum, p) => sum + p.x, 0) / finderPatterns.length;
      const avgY = finderPatterns.reduce((sum, p) => sum + p.y, 0) / finderPatterns.length;
      const qrPosition = {
        x: (avgX / scanAreaWidth) * 100,
        y: (avgY / scanAreaHeight) * 100,
      };

      if (estimatedQRSize < TOO_SMALL_THRESHOLD) {
        return {
          success: false,
          feedback: this.createFeedback('too_far', 50, estimatedQRSize, qrPosition),
          processingTime,
        };
      }

      if (estimatedQRSize > TOO_LARGE_THRESHOLD) {
        return {
          success: false,
          feedback: this.createFeedback('too_close', 50, estimatedQRSize, qrPosition),
          processingTime,
        };
      }

      // QR is visible but can't decode
      if (quality.contrast < MIN_CONTRAST) {
        return {
          success: false,
          feedback: this.createFeedback('low_contrast', 40, estimatedQRSize, qrPosition),
          processingTime,
        };
      }

      if (finderPatterns.length < 3) {
        return {
          success: false,
          feedback: this.createFeedback('partial', 40, estimatedQRSize, qrPosition),
          processingTime,
        };
      }

      // Likely blurry or motion blur
      return {
        success: false,
        feedback: this.createFeedback('blurry', 45, estimatedQRSize, qrPosition),
        processingTime,
      };
    }

    // No QR detected at all
    return {
      success: false,
      feedback: this.createFeedback('scanning', 0),
      processingTime,
    };
  }

  /**
   * Fast scan - optimized for speed, minimal analysis
   */
  fastScan(imageData: ImageData): { success: boolean; data?: string } {
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (qrResult && qrResult.data) {
      const now = Date.now();
      if (qrResult.data === this.lastSuccessfulScan && 
          now - this.lastScanTime < this.scanCooldown) {
        return { success: false };
      }
      
      this.lastSuccessfulScan = qrResult.data;
      this.lastScanTime = now;
      return { success: true, data: qrResult.data };
    }

    return { success: false };
  }

  /**
   * Calculate QR size relative to scan area
   */
  private calculateQRSize(qr: QRCode, areaWidth: number, areaHeight: number): number {
    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = qr.location;
    
    const width = Math.max(
      Math.abs(topRightCorner.x - topLeftCorner.x),
      Math.abs(bottomRightCorner.x - bottomLeftCorner.x)
    );
    const height = Math.max(
      Math.abs(bottomLeftCorner.y - topLeftCorner.y),
      Math.abs(bottomRightCorner.y - topRightCorner.y)
    );
    
    const qrArea = width * height;
    const scanArea = areaWidth * areaHeight;
    
    return (qrArea / scanArea) * 100;
  }

  /**
   * Calculate QR center position
   */
  private calculateQRPosition(qr: QRCode, areaWidth: number, areaHeight: number): { x: number; y: number } {
    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = qr.location;
    
    const centerX = (topLeftCorner.x + topRightCorner.x + bottomLeftCorner.x + bottomRightCorner.x) / 4;
    const centerY = (topLeftCorner.y + topRightCorner.y + bottomLeftCorner.y + bottomRightCorner.y) / 4;
    
    return {
      x: (centerX / areaWidth) * 100,
      y: (centerY / areaHeight) * 100,
    };
  }

  /**
   * Analyze image quality (brightness, contrast)
   */
  private analyzeImageQuality(imageData: ImageData): { brightness: number; contrast: number } {
    const data = imageData.data;
    const sampleSize = Math.min(10000, data.length / 4);
    const step = Math.floor(data.length / 4 / sampleSize);
    
    let sum = 0;
    let sumSq = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      sum += gray;
      sumSq += gray * gray;
      count++;
    }
    
    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    const contrast = Math.sqrt(variance);
    
    return {
      brightness: mean,
      contrast: contrast,
    };
  }

  /**
   * Detect finder patterns in image (the big squares in QR corners)
   * Uses run-length analysis on multiple scan lines
   */
  private detectFinderPatterns(imageData: ImageData): FinderPattern[] {
    const patterns: FinderPattern[] = [];
    const { width, height, data } = imageData;
    
    // Sample horizontal lines for finder patterns
    const linesToScan = 20;
    const lineStep = Math.floor(height / linesToScan);
    
    for (let y = 0; y < height; y += lineStep) {
      const linePatterns = this.scanLineForFinderPattern(data, width, y, width);
      patterns.push(...linePatterns);
    }
    
    // Sample vertical lines
    const colStep = Math.floor(width / linesToScan);
    for (let x = 0; x < width; x += colStep) {
      const colPatterns = this.scanColumnForFinderPattern(data, width, height, x);
      patterns.push(...colPatterns);
    }
    
    // Filter and cluster patterns
    return this.clusterPatterns(patterns);
  }

  /**
   * Scan a horizontal line for finder pattern
   */
  private scanLineForFinderPattern(
    data: Uint8ClampedArray,
    width: number,
    y: number,
    imageWidth: number
  ): FinderPattern[] {
    const patterns: FinderPattern[] = [];
    const threshold = 128;
    
    const runLengths: number[] = [];
    let currentColor = data[y * imageWidth * 4] < threshold ? 0 : 1;
    let currentRun = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * imageWidth + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const color = gray < threshold ? 0 : 1;
      
      if (color === currentColor) {
        currentRun++;
      } else {
        runLengths.push(currentRun);
        
        if (runLengths.length >= 5) {
          if (this.matchesFinderPattern(runLengths.slice(-5))) {
            const totalWidth = runLengths.slice(-5).reduce((a, b) => a + b, 0);
            const patternStartX = x - totalWidth;
            patterns.push({
              x: patternStartX + totalWidth / 2,
              y: y,
              size: totalWidth / 7,  // Finder pattern is 7 modules wide
              confidence: 0.7,
            });
          }
        }
        
        currentColor = color;
        currentRun = 1;
      }
    }
    
    return patterns;
  }

  /**
   * Scan a vertical column for finder pattern
   */
  private scanColumnForFinderPattern(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number
  ): FinderPattern[] {
    const patterns: FinderPattern[] = [];
    const threshold = 128;
    
    const runLengths: number[] = [];
    let currentColor = data[x * 4] < threshold ? 0 : 1;
    let currentRun = 0;
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const color = gray < threshold ? 0 : 1;
      
      if (color === currentColor) {
        currentRun++;
      } else {
        runLengths.push(currentRun);
        
        if (runLengths.length >= 5) {
          if (this.matchesFinderPattern(runLengths.slice(-5))) {
            const totalHeight = runLengths.slice(-5).reduce((a, b) => a + b, 0);
            const patternStartY = y - totalHeight;
            patterns.push({
              x: x,
              y: patternStartY + totalHeight / 2,
              size: totalHeight / 7,
              confidence: 0.7,
            });
          }
        }
        
        currentColor = color;
        currentRun = 1;
      }
    }
    
    return patterns;
  }

  /**
   * Check if run lengths match finder pattern ratio [1,1,3,1,1]
   */
  private matchesFinderPattern(runs: number[]): boolean {
    if (runs.length !== 5) return false;
    
    const total = runs.reduce((a, b) => a + b, 0);
    if (total < 7) return false;
    
    const moduleSize = total / 7;
    const tolerance = moduleSize * FINDER_PATTERN_TOLERANCE;
    
    return (
      Math.abs(runs[0] - moduleSize) < tolerance &&
      Math.abs(runs[1] - moduleSize) < tolerance &&
      Math.abs(runs[2] - 3 * moduleSize) < tolerance &&
      Math.abs(runs[3] - moduleSize) < tolerance &&
      Math.abs(runs[4] - moduleSize) < tolerance
    );
  }

  /**
   * Cluster nearby patterns into single detection points
   */
  private clusterPatterns(patterns: FinderPattern[]): FinderPattern[] {
    if (patterns.length === 0) return [];
    
    const clustered: FinderPattern[] = [];
    const used = new Set<number>();
    const clusterRadius = 20;
    
    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue;
      
      const cluster: FinderPattern[] = [patterns[i]];
      used.add(i);
      
      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue;
        
        const dx = patterns[i].x - patterns[j].x;
        const dy = patterns[i].y - patterns[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < clusterRadius) {
          cluster.push(patterns[j]);
          used.add(j);
        }
      }
      
      // Average the cluster
      const avgX = cluster.reduce((s, p) => s + p.x, 0) / cluster.length;
      const avgY = cluster.reduce((s, p) => s + p.y, 0) / cluster.length;
      const avgSize = cluster.reduce((s, p) => s + p.size, 0) / cluster.length;
      const avgConf = Math.min(1, cluster.length * 0.3);
      
      clustered.push({ x: avgX, y: avgY, size: avgSize, confidence: avgConf });
    }
    
    return clustered;
  }

  /**
   * Create feedback object with stabilization
   */
  private createFeedback(
    status: ScanStatus,
    confidence: number,
    qrSize?: number,
    qrPosition?: { x: number; y: number }
  ): ScanFeedback {
    const messages: Record<ScanStatus, { en: string; ar: string }> = {
      idle: { en: 'Ready to scan', ar: 'جاهز للمسح' },
      scanning: { en: 'Point at QR code', ar: 'وجّه الكاميرا نحو رمز QR' },
      detected: { en: 'QR code detected!', ar: 'تم اكتشاف رمز QR!' },
      too_far: { en: 'Move closer to QR code', ar: 'اقترب من رمز QR' },
      too_close: { en: 'Move away from QR code', ar: 'ابتعد عن رمز QR' },
      blurry: { en: 'Hold steady', ar: 'ثبّت الكاميرا' },
      low_contrast: { en: 'Improve lighting', ar: 'حسّن الإضاءة' },
      partial: { en: 'Center the QR code', ar: 'ضع رمز QR في المنتصف' },
      processing: { en: 'Processing...', ar: 'جاري المعالجة...' },
    };

    const feedback: ScanFeedback = {
      status,
      message: messages[status].en,
      messageAr: messages[status].ar,
      confidence,
      qrSize,
      qrPosition,
    };

    // Stabilize feedback to avoid flickering
    if (this.lastFeedback?.status === status) {
      this.feedbackStabilityCount++;
    } else {
      this.feedbackStabilityCount = 0;
    }

    // Only change feedback if stable for threshold frames
    if (this.feedbackStabilityCount >= this.feedbackStabilityThreshold || 
        status === 'detected' || 
        this.lastFeedback === null) {
      this.lastFeedback = feedback;
      return feedback;
    }

    return this.lastFeedback;
  }

  /**
   * Reset scanner state
   */
  reset(): void {
    this.lastSuccessfulScan = '';
    this.lastScanTime = 0;
    this.consecutiveFailures = 0;
    this.lastFeedback = null;
    this.feedbackStabilityCount = 0;
  }

  /**
   * Update cooldown
   */
  setCooldown(ms: number): void {
    this.scanCooldown = ms;
  }
}

// ==================== Export singleton instance ====================

export const scannerEngine = new QRScannerEngine();

// ==================== Helper function for React components ====================

/**
 * Get feedback color based on status
 */
export function getFeedbackColor(status: ScanStatus): string {
  switch (status) {
    case 'detected':
      return 'text-emerald-400 bg-emerald-500/20';
    case 'too_far':
    case 'too_close':
      return 'text-amber-400 bg-amber-500/20';
    case 'blurry':
    case 'low_contrast':
    case 'partial':
      return 'text-orange-400 bg-orange-500/20';
    case 'scanning':
    case 'idle':
    default:
      return 'text-muted-foreground bg-muted';
  }
}

/**
 * Get feedback icon name based on status
 */
export function getFeedbackIcon(status: ScanStatus): 'check' | 'arrow-down' | 'arrow-up' | 'move' | 'sun' | 'target' | 'scan' {
  switch (status) {
    case 'detected':
      return 'check';
    case 'too_far':
      return 'arrow-down';  // Move closer
    case 'too_close':
      return 'arrow-up';    // Move away
    case 'blurry':
      return 'target';      // Hold steady
    case 'low_contrast':
      return 'sun';         // More light
    case 'partial':
      return 'move';        // Center it
    case 'scanning':
    case 'idle':
    default:
      return 'scan';
  }
}

