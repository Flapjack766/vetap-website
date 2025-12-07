'use client';

/**
 * VETAP Event - QR Code Display Component
 * 
 * Client-side component for displaying styled QR codes
 * Uses modern rounded style matching server-side generation
 */

import { useEffect, useRef, useState } from 'react';

interface QRCodeDisplayProps {
  payload: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  marginSize?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
  style?: 'square' | 'rounded' | 'dots' | 'extra-rounded';
}

export function QRCodeDisplay({
  payload,
  size = 256,
  level = 'M',
  marginSize = 1,
  fgColor = '#1a1a2e',
  bgColor = '#FFFFFF',
  className = '',
  style = 'extra-rounded',
}: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initQR = async () => {
      if (!containerRef.current) return;

      // Clear previous QR
      containerRef.current.innerHTML = '';

      try {
        // Dynamic import for client-side only
        const QRCodeStyling = (await import('qr-code-styling')).default;

        const getDotsType = (s: string) => {
          switch (s) {
            case 'square': return 'square';
            case 'dots': return 'dots';
            case 'rounded': return 'rounded';
            case 'extra-rounded':
            default: return 'extra-rounded';
          }
        };

        const getCornerSquareType = (s: string) => {
          switch (s) {
            case 'square': return 'square';
            case 'dots': return 'dot';
            case 'rounded':
            case 'extra-rounded':
            default: return 'extra-rounded';
          }
        };

        const getCornerDotType = (s: string) => {
          switch (s) {
            case 'square': return 'square';
            default: return 'dot';
          }
        };

        const qrCode = new QRCodeStyling({
          width: size,
          height: size,
          data: payload,
          margin: marginSize * 10,
          qrOptions: {
            errorCorrectionLevel: level,
          },
          dotsOptions: {
            type: getDotsType(style) as any,
            color: fgColor,
          },
          cornersSquareOptions: {
            type: getCornerSquareType(style) as any,
            color: fgColor,
          },
          cornersDotOptions: {
            type: getCornerDotType(style) as any,
            color: fgColor,
          },
          backgroundOptions: {
            color: bgColor,
          },
        });

        qrCode.append(containerRef.current);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback to standard QR code
        const { QRCodeSVG } = await import('qrcode.react');
        // For fallback, we'll just show a placeholder
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
              <rect width="100%" height="100%" fill="${bgColor}"/>
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fgColor}" font-size="12">QR Loading...</text>
            </svg>
          `;
        }
      }
    };

    initQR();
  }, [payload, size, level, marginSize, fgColor, bgColor, style]);

  return (
    <div 
      ref={containerRef} 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

