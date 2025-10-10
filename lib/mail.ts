type MailData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  ticket: string;
  locale?: 'ar' | 'en';
};

const baseStyles = `
  body{margin:0;padding:0;background:#f5f5f5;color:#1a1a1a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:640px;margin:auto;padding:32px}
  .card{background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:24px;margin:16px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
  .brand{font-weight:700;font-size:24px;letter-spacing:.4px;margin-bottom:8px;color:#0a0a0a}
  .muted{color:#666;font-size:14px}
  .chip{display:inline-block;padding:8px 16px;border:1px solid #d4d4d4;border-radius:999px;background:#f5f5f5;font-weight:600;color:#0a0a0a}
  .success{background:#22c55e;color:#fff;padding:12px;border-radius:8px;text-align:center;margin:16px 0}
  h1{font-size:24px;margin:16px 0;color:#0a0a0a}
  h2{font-size:18px;margin:12px 0;color:#262626}
  p{margin:12px 0;line-height:1.6;color:#333}
  pre{white-space:pre-wrap;word-wrap:break-word;background:#f9f9f9;padding:12px;border-radius:8px;border:1px solid #e5e5e5;color:#1a1a1a}
  hr{border:0;border-top:1px solid #e5e5e5;margin:20px 0}
  .info-row{display:flex;margin:8px 0;padding:8px;background:#f9f9f9;border-radius:6px}
  .info-label{color:#666;min-width:100px;font-size:14px}
  .info-value{color:#0a0a0a;font-weight:500}
  .btn{display:inline-block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;text-align:center}
  .btn:hover{background:#20BA5A}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;border-top:1px solid #e5e5e5;margin-top:24px}
  .alert{background:#f0f7ff;border-left:4px solid #3b82f6;padding:12px;border-radius:4px;margin:16px 0;color:#1a1a1a}
  .whatsapp-icon{width:20px;height:20px;vertical-align:middle;margin-right:8px}
`;

export function renderClientEmailHTML(d: MailData): string {
  const arabic = d.locale === 'ar';
  const whatsappLink = `https://wa.me/996553198577?text=${encodeURIComponent(
    arabic 
      ? `مرحباً، رقم تذكرتي هو: ${d.ticket}` 
      : `Hello, my ticket number is: ${d.ticket}`
  )}`;
  
  return `
  <!doctype html><html lang="${arabic ? 'ar' : 'en'}" dir="${arabic ? 'rtl' : 'ltr'}">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${baseStyles}</style></head>
  <body><div class="wrap">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px">
      <div class="brand">VETAP</div>
      <p class="muted">${arabic ? 'هندسة مواقع احترافية' : 'Elite Website Design & Engineering'}</p>
    </div>

    <!-- Success Message -->
    <div class="success">
      <h1 style="margin:0;font-size:20px">✓ ${arabic ? 'تم استلام طلبك بنجاح!' : 'Request Received Successfully!'}</h1>
    </div>

    <!-- Ticket Info -->
    <div class="card">
      <p style="text-align:center;margin-bottom:16px">
        ${arabic ? 'رقم التذكرة الخاص بك' : 'Your Ticket Number'}
      </p>
      <p style="text-align:center">
        <span class="chip" style="font-size:18px">${d.ticket}</span>
      </p>
    </div>

    <!-- Thank You Message -->
    <div class="card">
      <h2>${arabic ? '🙏 شكراً لتواصلك معنا!' : '🙏 Thank You for Contacting Us!'}</h2>
      <p>${arabic 
        ? 'نقدر اهتمامك بخدماتنا. تم استلام رسالتك وسيقوم فريقنا بمراجعتها والرد عليك في أقرب وقت ممكن.' 
        : 'We appreciate your interest in our services. Your message has been received and our team will review it and respond to you as soon as possible.'
      }</p>
      
      <div class="alert">
        <p style="margin:0">
          <strong>ℹ️ ${arabic ? 'ملاحظة:' : 'Note:'}</strong> 
          ${arabic 
            ? 'هذه رسالة آلية، يرجى عدم الرد عليها. سنتواصل معك عبر البريد الإلكتروني أو الهاتف.' 
            : 'This is an automated message, please do not reply. We will contact you via email or phone.'
          }
        </p>
      </div>
    </div>

    <!-- Client Information -->
    <div class="card">
      <h2>${arabic ? '📋 معلومات الطلب' : '📋 Request Information'}</h2>
      
      <div class="info-row">
        <div class="info-label">${arabic ? 'الاسم:' : 'Name:'}</div>
        <div class="info-value">${d.name}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">${arabic ? 'البريد الإلكتروني:' : 'Email:'}</div>
        <div class="info-value">${d.email}</div>
      </div>
      
      ${d.phone ? `
      <div class="info-row">
        <div class="info-label">${arabic ? 'رقم الهاتف:' : 'Phone Number:'}</div>
        <div class="info-value">${d.phone}</div>
      </div>
      ` : ''}
      
      <div class="info-row">
        <div class="info-label">${arabic ? 'التاريخ:' : 'Date:'}</div>
        <div class="info-value">${new Date().toLocaleDateString(arabic ? 'ar-SA' : 'en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>

      <hr>
      
      <p><strong>${arabic ? '💬 رسالتك:' : '💬 Your Message:'}</strong></p>
      <pre>${d.message}</pre>
    </div>

    <!-- WhatsApp Contact -->
    <div class="card" style="text-align:center">
      <h2>${arabic ? '💬 تواصل معنا عبر واتساب' : '💬 Contact Us on WhatsApp'}</h2>
      <p class="muted">${arabic 
        ? 'للحصول على رد سريع، يمكنك التواصل معنا مباشرة عبر واتساب' 
        : 'For a quick response, you can contact us directly on WhatsApp'
      }</p>
      <a href="${whatsappLink}" class="btn" style="color:#fff">
        <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        ${arabic ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
      </a>
      <p class="muted" style="margin-top:8px">+996 553 198 577</p>
    </div>

    <!-- What's Next -->
    <div class="card">
      <h2>${arabic ? '📌 ماذا بعد؟' : '📌 What\'s Next?'}</h2>
      <p>${arabic 
        ? '1️⃣ سيقوم فريقنا بمراجعة طلبك خلال 24 ساعة<br>2️⃣ سنتواصل معك عبر البريد الإلكتروني أو الهاتف<br>3️⃣ يمكنك التواصل معنا مباشرة عبر واتساب للحصول على رد أسرع' 
        : '1️⃣ Our team will review your request within 24 hours<br>2️⃣ We will contact you via email or phone<br>3️⃣ You can contact us directly on WhatsApp for a faster response'
      }</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>VETAP</strong> - ${arabic ? 'هندسة مواقع احترافية' : 'Elite Website Design & Engineering'}</p>
      <p class="muted">
        📧 info@vetaps.com | 🌐 www.vetaps.com | 📱 +996 553 198 577
      </p>
      <p class="muted" style="margin-top:12px">
        © ${new Date().getFullYear()} VETAP. ${arabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
      </p>
      <p class="muted" style="font-size:11px;margin-top:8px">
        ${arabic 
          ? 'هذه رسالة آلية من نظام VETAP. يرجى عدم الرد على هذا البريد الإلكتروني.' 
          : 'This is an automated message from VETAP system. Please do not reply to this email.'
        }
      </p>
    </div>

  </div></body></html>`;
}

export function renderCompanyEmailHTML(d: MailData): string {
  return `
  <!doctype html><html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${baseStyles}</style></head>
  <body><div class="wrap">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px">
      <div class="brand">VETAP</div>
      <p class="muted">Internal Notification System</p>
    </div>

    <!-- Alert Banner -->
    <div style="background:#3b82f6;color:#fff;padding:16px;border-radius:8px;text-align:center;margin-bottom:16px">
      <h1 style="margin:0;font-size:20px;color:#fff">🔔 New Contact Request</h1>
    </div>

    <!-- Ticket Info -->
    <div class="card">
      <p style="text-align:center;margin-bottom:16px;color:#666">
        <strong>Ticket Number</strong>
      </p>
      <p style="text-align:center">
        <span class="chip" style="font-size:18px">${d.ticket}</span>
      </p>
    </div>

    <!-- Client Information -->
    <div class="card">
      <h2>📋 Client Information</h2>
      
      <div class="info-row">
        <div class="info-label">Name:</div>
        <div class="info-value">${d.name}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Email:</div>
        <div class="info-value"><a href="mailto:${d.email}" style="color:#3b82f6;text-decoration:none">${d.email}</a></div>
      </div>
      
      ${d.phone ? `
      <div class="info-row">
        <div class="info-label">Phone:</div>
        <div class="info-value"><a href="tel:${d.phone}" style="color:#3b82f6;text-decoration:none">${d.phone}</a></div>
      </div>
      ` : ''}
      
      <div class="info-row">
        <div class="info-label">Language:</div>
        <div class="info-value">${d.locale === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English'}</div>
      </div>

      <div class="info-row">
        <div class="info-label">Date & Time:</div>
        <div class="info-value">${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</div>
      </div>

      <hr>
      
      <p><strong>💬 Message:</strong></p>
      <pre>${d.message}</pre>
    </div>

    <!-- Quick Actions -->
    <div class="card" style="text-align:center">
      <h2>⚡ Quick Actions</h2>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="mailto:${d.email}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">📧 Reply via Email</a>
        ${d.phone ? `<a href="tel:${d.phone}" style="display:inline-block;padding:10px 20px;background:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">📞 Call Client</a>` : ''}
        <a href="https://wa.me/${d.phone?.replace(/[^0-9]/g, '')}" style="display:inline-block;padding:10px 20px;background:#25D366;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">💬 WhatsApp</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>VETAP Internal System</strong></p>
      <p class="muted" style="margin-top:8px">
        This is an automated notification from the contact form.
      </p>
      <p class="muted" style="margin-top:12px">
        © ${new Date().getFullYear()} VETAP. All rights reserved.
      </p>
    </div>

  </div></body></html>`;
}

