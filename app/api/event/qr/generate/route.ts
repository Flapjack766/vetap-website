import { NextRequest, NextResponse } from 'next/server';
import { generateQRDataURL } from '@/lib/event/qr-generator';

/**
 * POST /api/event/qr/generate
 * Generate QR code image from payload
 * 
 * Returns: Data URL (base64 PNG) or SVG
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, size, level, marginSize, format = 'png' } = body;

    if (!payload || typeof payload !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Payload is required' },
        { status: 400 }
      );
    }

    const options = {
      size: size || 256,
      level: level || 'M',
      marginSize: marginSize || 1,
    };

    if (format === 'png') {
      const dataURL = await generateQRDataURL(payload, options);
      return NextResponse.json(
        { 
          success: true, 
          data_url: dataURL,
          format: 'png'
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Unsupported format. Use "png"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message || 'Failed to generate QR code',
        hint: 'Make sure qrcode package is installed: npm install qrcode'
      },
      { status: 500 }
    );
  }
}

