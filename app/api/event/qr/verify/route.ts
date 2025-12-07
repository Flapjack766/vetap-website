import { NextRequest, NextResponse } from 'next/server';
import { verifyQRPayload, extractPassIdFromPayload } from '@/lib/event/qr-payload';
import { createEventClient } from '@/lib/supabase/event-server';

/**
 * POST /api/event/qr/verify
 * Verify QR code payload and return pass information
 * 
 * Used for check-in operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, partner_id } = body;

    if (!payload || typeof payload !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'QR payload is required' },
        { status: 400 }
      );
    }

    // Verify payload signature
    const decodedPayload = verifyQRPayload(payload, partner_id);

    if (!decodedPayload) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid QR code',
          message: 'QR code signature is invalid or expired'
        },
        { status: 200 } // Return 200 with valid: false (not an error, just invalid code)
      );
    }

    // Extract pass ID
    const passId = decodedPayload.pid;
    const eventId = decodedPayload.eid;

    const supabase = await createEventClient();

    // Fetch pass details
    const { data: pass, error: passError } = await supabase
      .from('event_passes')
      .select(`
        id,
        event_id,
        guest_id,
        token,
        status,
        first_scanned_at,
        last_scanned_at,
        valid_from,
        valid_to,
        revoked_at,
        guest:event_guests(id, full_name, email, phone, type)
      `)
      .eq('id', passId)
      .eq('event_id', eventId)
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Pass not found',
          message: 'QR code references a pass that does not exist'
        },
        { status: 200 }
      );
    }

    // Check if pass is valid
    const now = new Date();
    const validFrom = pass.valid_from ? new Date(pass.valid_from) : null;
    const validTo = pass.valid_to ? new Date(pass.valid_to) : null;

    if (validFrom && now < validFrom) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Pass not yet valid',
          message: `Pass is valid from ${validFrom.toISOString()}`,
          pass: pass
        },
        { status: 200 }
      );
    }

    if (validTo && now > validTo) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Pass expired',
          message: `Pass expired at ${validTo.toISOString()}`,
          pass: pass
        },
        { status: 200 }
      );
    }

    if (pass.revoked_at) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Pass revoked',
          message: 'This pass has been revoked',
          pass: pass
        },
        { status: 200 }
      );
    }

    if (pass.status === 'used') {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Pass already used',
          message: 'This pass has already been used',
          pass: pass,
          first_scanned_at: pass.first_scanned_at,
          last_scanned_at: pass.last_scanned_at
        },
        { status: 200 }
      );
    }

    // Pass is valid
    return NextResponse.json(
      { 
        valid: true,
        pass: pass,
        message: 'QR code is valid'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message || 'Failed to verify QR code'
      },
      { status: 500 }
    );
  }
}

