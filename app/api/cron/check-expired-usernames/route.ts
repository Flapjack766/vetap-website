import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint should be protected with a secret token
// Call it from a cron service (e.g., Vercel Cron, GitHub Actions, or external cron)
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-token-here';

/**
 * Email template for expired custom username notification
 */
function renderExpiredUsernameEmailHTML(data: {
  username: string;
  expiresAt: string;
  locale?: 'ar' | 'en';
}): string {
  const arabic = data.locale === 'ar';
  const expiresDate = new Date(data.expiresAt).toLocaleDateString(
    arabic ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return `
  <!doctype html>
  <html lang="${arabic ? 'ar' : 'en'}" dir="${arabic ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{margin:0;padding:0;background:#f5f5f5;color:#1a1a1a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
      .wrap{max-width:640px;margin:auto;padding:32px}
      .card{background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:24px;margin:16px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
      .brand{font-weight:700;font-size:24px;letter-spacing:.4px;margin-bottom:8px;color:#0a0a0a}
      .muted{color:#666;font-size:14px}
      h1{font-size:24px;margin:16px 0;color:#0a0a0a}
      p{margin:12px 0;line-height:1.6;color:#333}
      .alert{background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin:16px 0;color:#1a1a1a}
      .btn{display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;text-align:center}
      .footer{text-align:center;padding:20px;color:#666;font-size:12px;border-top:1px solid #e5e5e5;margin-top:24px}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div style="text-align:center;margin-bottom:24px">
        <div class="brand">VETAP</div>
        <p class="muted">${arabic ? 'هندسة مواقع احترافية' : 'Elite Website Design & Engineering'}</p>
      </div>

      <div class="card">
        <h1>${arabic ? '⏰ انتهت مدة اسم المستخدم المخصص' : '⏰ Custom Username Expired'}</h1>
        
        <div class="alert">
          <p style="margin:0">
            <strong>${arabic ? 'تنبيه:' : 'Notice:'}</strong> 
            ${arabic 
              ? `انتهت مدة اسم المستخدم المخصص "${data.username}" في ${expiresDate}.` 
              : `Your custom username "${data.username}" expired on ${expiresDate}.`
            }
          </p>
        </div>

        <p>
          ${arabic 
            ? 'نود إعلامك بأن مدة اسم المستخدم المخصص الخاص بك قد انتهت. يمكنك الآن استخدام اسم المستخدم العشوائي الخاص بك، أو يمكنك طلب اسم مستخدم مخصص جديد من لوحة التحكم.' 
            : 'We would like to inform you that your custom username subscription has expired. You can now use your random username, or you can request a new custom username from your dashboard.'
          }
        </p>

        <p>
          ${arabic 
            ? 'إذا كنت ترغب في تجديد اسم المستخدم المخصص، يرجى زيارة لوحة التحكم وطلب اسم مستخدم مخصص جديد.' 
            : 'If you would like to renew your custom username, please visit your dashboard and request a new custom username.'
          }
        </p>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.SITE_URL || 'https://vetaps.com'}/dashboard" class="btn">
            ${arabic ? 'زيارة لوحة التحكم' : 'Visit Dashboard'}
          </a>
        </div>
      </div>

      <div class="footer">
        <p><strong>VETAP</strong> - ${arabic ? 'هندسة مواقع احترافية' : 'Elite Website Design & Engineering'}</p>
        <p class="muted">
          📧 info@vetaps.com | 🌐 www.vetaps.com
        </p>
        <p class="muted" style="margin-top:12px">
          © ${new Date().getFullYear()} VETAP. ${arabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

/**
 * Check and process expired custom usernames
 * This endpoint should be called by a cron job daily
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = authHeader?.replace('Bearer ', '') || req.nextUrl.searchParams.get('secret');
    
    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Call the database function to check and update expired usernames
    const { data: expiredProfiles, error: functionError } = await supabase
      .rpc('check_expired_custom_usernames');

    if (functionError) {
      console.error('Error checking expired usernames:', functionError);
      return NextResponse.json(
        { 
          error: 'Failed to check expired usernames',
          details: functionError.message 
        },
        { status: 500 }
      );
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired usernames found',
        count: 0,
      });
    }

    // Send email notifications to users with expired usernames
    const emailResults = [];
    const companyEmail = process.env.COMPANY_EMAIL || 'info@vetaps.com';
    const fromEmail = process.env.FROM_EMAIL || 'VETAP <no-reply@vetaps.com>';

    for (const profile of expiredProfiles) {
      if (!profile.email) {
        console.warn(`Profile ${profile.profile_id} has no email, skipping notification`);
        continue;
      }

      try {
        // Determine locale (default to 'en' if not available)
        // You might want to store user locale in profiles table
        // For now, defaulting to English. In the future, you can get this from profiles table
        // Determine locale (default to 'en' if not available)
        // You might want to store user locale in profiles table
        // For now, defaulting to English. In the future, you can get this from profiles table
        // TODO: Get locale from profile or user preferences
        // Using a function to determine locale to avoid TypeScript literal type narrowing
        const getLocale = (): 'ar' | 'en' => {
          // In the future, get this from profile.locale or user preferences
          return 'en';
        };
        const userLocale = getLocale();

        const emailHTML = renderExpiredUsernameEmailHTML({
          username: profile.username_custom || '',
          expiresAt: profile.custom_username_expires_at || '',
          locale: userLocale,
        });

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: profile.email,
          subject: userLocale === 'ar'
            ? `انتهت مدة اسم المستخدم المخصص - ${profile.username_custom}`
            : `Custom Username Expired - ${profile.username_custom}`,
          html: emailHTML,
        });

        if (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
          emailResults.push({
            profile_id: profile.profile_id,
            email: profile.email,
            success: false,
            error: emailError.message,
          });
        } else {
          emailResults.push({
            profile_id: profile.profile_id,
            email: profile.email,
            success: true,
            email_id: emailData?.id,
          });
        }
      } catch (error: any) {
        console.error(`Error processing email for profile ${profile.profile_id}:`, error);
        emailResults.push({
          profile_id: profile.profile_id,
          email: profile.email,
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredProfiles.length} expired username(s)`,
      expired_count: expiredProfiles.length,
      emails_sent: emailResults.filter(r => r.success).length,
      emails_failed: emailResults.filter(r => !r.success).length,
      results: emailResults,
    });
  } catch (error: any) {
    console.error('Error in check-expired-usernames cron:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that use POST
export async function POST(req: NextRequest) {
  return GET(req);
}

