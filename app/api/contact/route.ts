import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { renderClientEmailHTML, renderCompanyEmailHTML } from '@/lib/mail';
import { genTicket } from '@/lib/ticket';
import { sanitizeInput } from '@/lib/utils';
import { checkRateLimit } from '@/lib/security';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(5).max(25).optional().or(z.literal('')),
  message: z.string().min(10).max(2000),
  locale: z.enum(['ar', 'en']).default('en'),
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 3, 60000)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Sanitize inputs
    const sanitizedBody = {
      ...body,
      name: sanitizeInput(body.name || ''),
      email: sanitizeInput(body.email || ''),
      phone: body.phone ? sanitizeInput(body.phone) : undefined,
      message: sanitizeInput(body.message || ''),
    };

    const data = schema.parse(sanitizedBody);
    const ticket = genTicket();

    // Prepare email data
    const emailData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      ticket,
      locale: data.locale,
    };

    // Generate HTML emails
    const clientHTML = renderClientEmailHTML(emailData);
    const companyHTML = renderCompanyEmailHTML(emailData);

    // Send emails in parallel
    await Promise.all([
      resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: data.email,
        subject: `VETAP • ${data.locale === 'ar' ? 'تأكيد الطلب' : 'Request Confirmation'} • ${ticket}`,
        html: clientHTML,
      }),
      resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: process.env.COMPANY_EMAIL!,
        subject: `New Contact Request • ${ticket}`,
        html: companyHTML,
      }),
    ]);

    return NextResponse.json({ ok: true, ticket });
  } catch (e: any) {
    console.error('Contact form error:', e);
    
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: e.message ?? 'Something went wrong' },
      { status: 400 }
    );
  }
}

