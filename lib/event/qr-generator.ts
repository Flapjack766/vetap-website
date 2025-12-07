/**
 * VETAP Event - QR Code Generator
 * 
 * Generates QR code images from payload strings
 * Uses rounded/modern QR code style
 */

import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import type { QRCodeRenderersOptions } from 'qrcode.react';

/**
 * QR Code Generation Options
 */
export interface QRCodeOptions {
  size?: number; // Size in pixels (default: 256)
  level?: 'L' | 'M' | 'Q' | 'H'; // Error correction level (default: 'M')
  marginSize?: number; // Margin size (default: 1)
  color?: {
    dark?: string; // Dark color (default: '#000000')
    light?: string; // Light color (default: '#FFFFFF')
  };
  style?: 'square' | 'rounded' | 'dots' | 'extra-rounded'; // QR style (default: 'extra-rounded')
}

/**
 * Default QR code options
 */
const defaultOptions: Required<QRCodeOptions> = {
  size: 256,
  level: 'M',
  marginSize: 1,
  color: {
    dark: '#1a1a2e', // Modern dark blue-black color
    light: '#FFFFFF',
  },
  style: 'extra-rounded', // Modern rounded style
};

/**
 * Generate QR code as SVG string
 * @param payload - QR payload string
 * @param options - QR code options
 * @returns SVG string
 */
export function generateQRSVG(
  payload: string,
  options: QRCodeOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  // This is a simplified version - in a real implementation,
  // you'd use a server-side QR code library like 'qrcode' (npm package)
  // For now, we'll return a placeholder that can be rendered client-side
  
  // Note: This function should ideally be server-side using 'qrcode' package
  // For client-side, use the React component directly
  
  return `<!-- QR Code SVG for: ${payload.substring(0, 20)}... -->`;
}

// Note: Style options are kept for future use when a compatible library is available
// Currently using standard qrcode package which doesn't support rounded styles

/**
 * Generate QR code using standard qrcode library
 * Note: qr-code-styling-node doesn't work in Next.js server environment
 * Using standard qrcode package instead with clean styling
 * @param payload - QR payload string
 * @param options - QR code options
 * @returns Promise resolving to Buffer
 */
async function generateStyledQR(
  payload: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = { ...defaultOptions, ...options };
  // Use standard QR code generation (qr-code-styling-node has browser dependency issues)
  return generateStandardQRBuffer(payload, opts);
}

/**
 * Fallback standard QR code generation
 */
async function generateStandardQRBuffer(
  payload: string,
  opts: Required<QRCodeOptions>
): Promise<Buffer> {
  const QRCode = await import('qrcode');
  return QRCode.default.toBuffer(payload, {
    width: opts.size,
    margin: opts.marginSize,
    errorCorrectionLevel: opts.level,
    color: {
      dark: opts.color.dark,
      light: opts.color.light,
    },
  });
}

/**
 * Generate QR code as Data URL (base64 PNG)
 * Uses modern rounded style by default
 * @param payload - QR payload string
 * @param options - QR code options
 * @returns Promise resolving to data URL
 */
export async function generateQRDataURL(
  payload: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const buffer = await generateStyledQR(payload, options);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as Buffer (for server-side file saving)
 * Uses modern rounded style by default
 * @param payload - QR payload string
 * @param options - QR code options
 * @returns Promise resolving to Buffer
 */
export async function generateQRBuffer(
  payload: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  try {
    return await generateStyledQR(payload, options);
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * React component props for QR code rendering
 */
export interface QRCodeComponentProps {
  payload: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  marginSize?: number;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Get QR code renderer options for React components
 */
export function getQRCodeRendererOptions(
  options: QRCodeOptions = {}
): QRCodeRenderersOptions {
  const opts = { ...defaultOptions, ...options };
  
  return {
    size: opts.size,
    level: opts.level,
    marginSize: opts.marginSize,
    fgColor: opts.color.dark,
    bgColor: opts.color.light,
  };
}

