type Locale = 'ar' | 'en';

type ShowcaseAnswers = {
  industry?: string;
  industryOther?: string;
  services?: string[];
  budget?: string;
  speed?: string;
};

export type MailData = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  ticket: string;
  locale?: Locale;
  showcaseAnswers?: ShowcaseAnswers | null;
};

type UsernameRequestData = {
  name: string;
  email: string;
  requested_username: string;
  locale?: Locale;
};

type UsernameApprovalData = UsernameRequestData & {
  expires_at: string;
};

type UsernameRejectionData = UsernameRequestData & {
  rejection_reason?: string;
};

type BranchTrackingRequestData = {
  name: string;
  email: string;
  locale?: Locale;
};

type BranchTrackingApprovalData = BranchTrackingRequestData;

type BranchTrackingRejectionData = BranchTrackingRequestData & {
  rejection_reason?: string;
};

const SITE_URL = process.env.SITE_URL || 'https://vetaps.com';
const WHATSAPP_NUMBER = '+905346146038';
const WHATSAPP_URL = 'https://wa.me/905346146038';

const BRAND_TAGLINE: Record<Locale, string> = {
  en: 'Integrated Digital Solutions',
  ar: 'حلول رقمية متكاملة',
};

const baseStyles = `
  :root {
    color-scheme: light;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 32px 0;
    background: #f4f5f7;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
  }
  table {
    border-collapse: collapse;
  }
  .email-container {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.08);
  }
  .header {
    padding: 32px;
    text-align: center;
    background: linear-gradient(135deg, #111827, #0f766e);
    color: #ffffff;
  }
  .brand {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  .subtitle {
    margin-top: 6px;
    font-size: 14px;
    opacity: 0.75;
  }
  .hero {
    font-size: 28px;
    line-height: 1.4;
    margin: 16px 0 8px;
  }
  .hero-description {
    font-size: 15px;
    opacity: 0.85;
    margin: 0;
  }
  .content {
    padding: 32px;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  .card h3 {
    margin: 0 0 12px;
    font-size: 18px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .info-label {
    font-weight: 600;
    color: #475569;
  }
  .info-value {
    text-align: end;
    color: #0f172a;
    font-weight: 500;
  }
  .message-box {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
  }
  .cta {
    text-align: center;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    border-radius: 999px;
    background: #0f766e;
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
    margin: 4px;
  }
  .muted {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    margin-top: 32px;
  }
  @media (max-width: 480px) {
    .content {
      padding: 20px;
    }
    .info-row {
      flex-direction: column;
      text-align: start;
    }
    .info-value {
      text-align: start;
    }
  }
`;

function resolveLocale(locale?: Locale | null): Locale {
  return locale === 'ar' ? 'ar' : 'en';
}

function wrapEmail(locale: Locale, heading: string, description: string, body: string): string {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
    <style>${baseStyles}</style>
  </head>
  <body>
    <table class="email-container" role="presentation" width="100%">
      <tr>
        <td>
          <div class="header">
            <div class="brand">VETAP</div>
            <div class="subtitle">${BRAND_TAGLINE[locale]}</div>
            <p class="hero">${heading}</p>
            <p class="hero-description">${description}</p>
          </div>
          <div class="content">
            ${body}
            <p class="muted">© ${new Date().getFullYear()} VETAP — ${BRAND_TAGLINE[locale]}</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInfoRow(label: string, value?: string | null): string {
  if (!value) return '';
  return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
}

function formatDateForLocale(date: Date, locale: Locale, includeTime = true): string {
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'long', day: 'numeric' };

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(date);
}

function renderShowcaseAnswers(answers: ShowcaseAnswers | null | undefined, locale: Locale): string {
  if (!answers) return '';

  const labels = {
    title: locale === 'ar' ? 'تفاصيل الاستمارة التفاعلية' : 'Interactive Questionnaire Details',
    industry: locale === 'ar' ? 'القطاع' : 'Industry',
    services: locale === 'ar' ? 'الخدمات المطلوبة' : 'Requested Services',
    budget: locale === 'ar' ? 'الميزانية المتوقعة' : 'Estimated Budget',
    speed: locale === 'ar' ? 'السرعة المطلوبة' : 'Desired Timeline',
  };

  const items: string[] = [];

  if (answers.industry) {
    const other = answers.industry === 'other' && answers.industryOther ? ` — ${escapeHtml(answers.industryOther)}` : '';
    items.push(formatInfoRow(labels.industry, `${escapeHtml(answers.industry)}${other}`));
  }

  if (answers.services?.length) {
    const servicesList = answers.services.map((service) => escapeHtml(service)).join('<br />');
    items.push(formatInfoRow(labels.services, servicesList));
  }

  if (answers.budget) {
    items.push(formatInfoRow(labels.budget, escapeHtml(answers.budget)));
  }

  if (answers.speed) {
    items.push(formatInfoRow(labels.speed, escapeHtml(answers.speed)));
  }

  if (!items.length) return '';

  return `<div class="card">
    <h3>${labels.title}</h3>
    ${items.join('')}
  </div>`;
}

export function renderClientEmailHTML(data: MailData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'تم استلام طلبك بنجاح' : 'We Received Your Request',
    description:
      locale === 'ar'
        ? `رقم التذكرة الخاص بك هو ${escapeHtml(data.ticket)}؛ سنعود إليك خلال أقل من 24 ساعة.`
        : `Your ticket number is ${escapeHtml(data.ticket)} and we will get back to you within 24 hours.`,
    summaryTitle: locale === 'ar' ? 'تفاصيل الطلب' : 'Request Details',
    name: locale === 'ar' ? 'الاسم' : 'Name',
    email: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
    phone: locale === 'ar' ? 'رقم الهاتف' : 'Phone',
    ticket: locale === 'ar' ? 'رقم التذكرة' : 'Ticket',
    message: locale === 'ar' ? 'رسالتك' : 'Your Message',
    thanks: locale === 'ar' ? 'فريق VETAP جاهز دائماً لمساعدتك.' : 'The VETAP team is always ready to help.',
    followUp: locale === 'ar'
      ? 'لأي استفسار عاجل يمكنك التواصل معنا عبر واتساب أو زيارة موقعنا.'
      : 'For urgent questions feel free to contact us on WhatsApp or visit our website.',
    messageLabel: locale === 'ar' ? '💬 رسالتك' : '💬 Message',
  };

  const details = [
    formatInfoRow(labels.ticket, escapeHtml(data.ticket)),
    formatInfoRow(labels.name, escapeHtml(data.name)),
    formatInfoRow(labels.email, escapeHtml(data.email)),
    formatInfoRow(labels.phone, escapeHtml(data.phone)),
  ].join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      ${details}
      <div class="message-box">
        <strong>${labels.messageLabel}</strong><br />
        ${escapeHtml(data.message)}
      </div>
    </div>
    ${renderShowcaseAnswers(data.showcaseAnswers, locale)}
    <div class="card cta">
      <p>${labels.followUp}</p>
      <a class="btn" href="${WHATSAPP_URL}">WhatsApp ${WHATSAPP_NUMBER}</a>
      <a class="btn" href="${SITE_URL}">${locale === 'ar' ? 'زيارة الموقع' : 'Visit Website'}</a>
      <p style="margin-top:16px;font-size:13px;color:#64748b;">${labels.thanks}</p>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderCompanyEmailHTML(data: MailData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'طلب تواصل جديد' : 'New Contact Submission',
    description:
      locale === 'ar'
        ? `يرجى مراجعة الطلب رقم ${escapeHtml(data.ticket)} والتواصل مع العميل.`
        : `Please review ticket ${escapeHtml(data.ticket)} and follow up with the client.`,
    summaryTitle: locale === 'ar' ? 'بيانات العميل' : 'Client Information',
    messageTitle: locale === 'ar' ? 'الرسالة' : 'Message',
  };

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      ${formatInfoRow('Ticket', escapeHtml(data.ticket))}
      ${formatInfoRow('Name', escapeHtml(data.name))}
      ${formatInfoRow('Email', escapeHtml(data.email))}
      ${formatInfoRow('Phone', escapeHtml(data.phone))}
    </div>
    <div class="card">
      <h3>${labels.messageTitle}</h3>
      <div class="message-box">${escapeHtml(data.message)}</div>
    </div>
    ${renderShowcaseAnswers(data.showcaseAnswers, locale)}
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderUsernameRequestEmailHTML(data: UsernameRequestData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'طلب اسم مستخدم مخصص' : 'Custom Username Request',
    description:
      locale === 'ar'
        ? 'طلبك قيد المراجعة وسيتم الرد خلال 24-72 ساعة.'
        : 'Your request is being reviewed and we will reply within 24-72 hours.',
    summaryTitle: locale === 'ar' ? 'ملخص الطلب' : 'Request Summary',
    username: locale === 'ar' ? 'الاسم المطلوب' : 'Requested Username',
    status: locale === 'ar' ? 'الحالة' : 'Status',
    statusValue: locale === 'ar' ? 'قيد المراجعة' : 'Pending Review',
    note: locale === 'ar'
      ? 'سيتواصل معك فريقنا عبر البريد الإلكتروني فور اتخاذ القرار.'
      : 'Our team will contact you by email as soon as a decision is made.',
  };

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      ${formatInfoRow(labels.username, `@${escapeHtml(data.requested_username)}`)}
      ${formatInfoRow(labels.status, labels.statusValue)}
    </div>
    <div class="card">
      <p style="margin:0;">${labels.note}</p>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderUsernameApprovalEmailHTML(data: UsernameApprovalData): string {
  const locale = resolveLocale(data.locale);
  const expiry = formatDateForLocale(new Date(data.expires_at), locale);

  const labels = {
    heading: locale === 'ar' ? 'تمت الموافقة على اسم المستخدم' : 'Username Approved',
    description:
      locale === 'ar'
        ? `يمكنك الآن استخدام @${escapeHtml(data.requested_username)} حتى ${expiry}.`
        : `You can now use @${escapeHtml(data.requested_username)} until ${expiry}.`,
    summaryTitle: locale === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details',
    username: locale === 'ar' ? 'الاسم المعتمد' : 'Approved Username',
    expires: locale === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiration Date',
    stepsTitle: locale === 'ar' ? 'الخطوات التالية' : 'Next Steps',
    steps: locale === 'ar'
      ? [
          'قم بتحديث صفحة البروفايل من الداشبورد.',
          'تابع تنبيهات انتهاء الاشتراك قبل التاريخ المحدد.',
          'يمكنك طلب التمديد قبل 3 أيام من الانتهاء.',
        ]
      : [
          'Update your profile link inside the dashboard.',
          'Monitor the expiry date to keep the username active.',
          'Request an extension at least 3 days before expiry.',
        ],
  };

  const stepsList = labels.steps.map((step) => `<li>${step}</li>`).join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      ${formatInfoRow(labels.username, `@${escapeHtml(data.requested_username)}`)}
      ${formatInfoRow(labels.expires, expiry)}
    </div>
    <div class="card">
      <h3>${labels.stepsTitle}</h3>
      <ul style="padding-${locale === 'ar' ? 'right' : 'left'}:20px;margin:0;">
        ${stepsList}
      </ul>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderUsernameRejectionEmailHTML(data: UsernameRejectionData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'تعذر الموافقة على اسم المستخدم' : 'Username Request Declined',
    description:
      locale === 'ar'
        ? 'يمكنك تحديث الطلب واختيار اسم بديل في أي وقت.'
        : 'You can update the request and choose an alternative username at any time.',
    summaryTitle: locale === 'ar' ? 'تفاصيل المراجعة' : 'Review Details',
    username: locale === 'ar' ? 'الاسم المطلوب' : 'Requested Username',
    reasonTitle: locale === 'ar' ? 'سبب الرفض' : 'Reason',
    defaultReason: locale === 'ar'
      ? 'الاسم غير متاح أو لا يتوافق مع سياسات التسمية لدينا.'
      : 'The username is unavailable or does not comply with our naming policies.',
    actionsTitle: locale === 'ar' ? 'ماذا يمكنك أن تفعل؟' : 'What can you do next?',
    actions: locale === 'ar'
      ? [
          'جرّب صيغة أخرى للاسم المطلوب.',
          'تأكد من خلو الاسم من الرموز والمسافات.',
          'اطلب مساعدة فريق الدعم في حال احتجت لتوصيات.',
        ]
      : [
          'Try an alternative spelling of the desired username.',
          'Ensure the username contains only lowercase letters, numbers, or hyphens.',
          'Reach out to support if you need recommendations.',
        ],
  };

  const reason = escapeHtml(data.rejection_reason) || labels.defaultReason;
  const actionsList = labels.actions.map((action) => `<li>${action}</li>`).join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      ${formatInfoRow(labels.username, `@${escapeHtml(data.requested_username)}`)}
      <div class="message-box">
        <strong>${labels.reasonTitle}</strong><br />
        ${reason}
      </div>
    </div>
    <div class="card">
      <h3>${labels.actionsTitle}</h3>
      <ul style="padding-${locale === 'ar' ? 'right' : 'left'}:20px;margin:0;">
        ${actionsList}
      </ul>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderBranchTrackingRequestEmailHTML(data: BranchTrackingRequestData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'تم استلام طلب داشبورد تتبع الفروع' : 'Branch Tracking Request Received',
    description:
      locale === 'ar'
        ? 'يقوم فريقنا بمراجعة طلبك وسيتم التواصل معك خلال 48 ساعة.'
        : 'Our team is reviewing your request and will contact you within 48 hours.',
    summaryTitle: locale === 'ar' ? 'ماذا يحدث بعد ذلك؟' : 'What happens next?',
    steps: locale === 'ar'
      ? [
          'التحقق من نوع النشاط التجاري والفروع المرتبطة.',
          'تفعيل الوصول إذا تم استيفاء المتطلبات.',
          'استلام رسالة أخرى بنتيجة المراجعة.',
        ]
      : [
          'We verify your business type and branch data.',
          'Access is granted if all requirements are met.',
          'You will receive another email with the final decision.',
        ],
  };

  const stepsList = labels.steps.map((step) => `<li>${step}</li>`).join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      <ul style="padding-${locale === 'ar' ? 'right' : 'left'}:20px;margin:0;">
        ${stepsList}
      </ul>
    </div>
    <div class="card cta">
      <p>${locale === 'ar' ? 'يمكنك متابعة الطلب من خلال الداشبورد في تبويب "رابطك".' : 'You can monitor the request inside the dashboard under “Your Link”.'}</p>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderBranchTrackingApprovalEmailHTML(data: BranchTrackingApprovalData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'تمت الموافقة على طلب داشبورد تتبع الفروع' : 'Branch Tracking Access Approved',
    description:
      locale === 'ar'
        ? 'يمكنك الآن الوصول إلى لوحة تتبع الفروع والكروت من الداشبورد.'
        : 'You can now access the Branch & Card Tracking dashboard from within your account.',
    summaryTitle: locale === 'ar' ? 'كيف تبدأ؟' : 'Getting Started',
    steps: locale === 'ar'
      ? [
          'سجّل الدخول إلى VETAP وافتح الداشبورد.',
          'ستجد زر "Branch Tracking Dashboard" بجوار زر لوحة التحكم.',
          'ابدأ بإضافة المنشآت والفروع ثم اربط كروت NFC بالرابط المناسب.',
        ]
      : [
          'Log in to VETAP and open your dashboard.',
          'You will see the “Branch Tracking Dashboard” button next to the main dashboard entry.',
          'Add businesses, branches, and link NFC cards with the new link builder.',
        ],
  };

  const stepsList = labels.steps.map((step) => `<li>${step}</li>`).join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      <ul style="padding-${locale === 'ar' ? 'right' : 'left'}:20px;margin:0;">
        ${stepsList}
      </ul>
    </div>
    <div class="card cta">
      <a class="btn" href="${SITE_URL}/dashboard">${locale === 'ar' ? 'تسجيل الدخول إلى الداشبورد' : 'Open Dashboard'}</a>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

export function renderBranchTrackingRejectionEmailHTML(data: BranchTrackingRejectionData): string {
  const locale = resolveLocale(data.locale);

  const labels = {
    heading: locale === 'ar' ? 'طلب تتبع الفروع يحتاج تحديثاً' : 'Branch Tracking Request Needs Updates',
    description:
      locale === 'ar'
        ? 'لم يتم تفعيل الوصول حالياً، ويمكنك تحديث الطلب وإعادة الإرسال.'
        : 'Access was not granted at this stage. You can update the request and resubmit.',
    summaryTitle: locale === 'ar' ? 'تفاصيل المراجعة' : 'Review Notes',
    reasonTitle: locale === 'ar' ? 'الملاحظات' : 'Notes',
    defaultReason: locale === 'ar'
      ? 'نرجو تزويدنا بمعلومات إضافية عن النشاط التجاري أو الفروع المرتبطة.'
      : 'Please share additional details about your business or associated branches.',
    nextStepsTitle: locale === 'ar' ? 'خطوات مقترحة' : 'Suggested Actions',
    steps: locale === 'ar'
      ? [
          'تأكد من اكتمال بيانات المنشأة والفروع داخل الداشبورد.',
          'أرسل مستندات داعمة (مثل السجل التجاري) إن لزم الأمر.',
          'أعد إرسال الطلب بعد تحديث البيانات.',
        ]
      : [
          'Verify that your business and branch profiles are complete.',
          'Provide supporting documents (e.g., commercial registration) if needed.',
          'Resubmit the request after updating your information.',
        ],
  };

  const reason = escapeHtml(data.rejection_reason) || labels.defaultReason;
  const stepsList = labels.steps.map((step) => `<li>${step}</li>`).join('');

  const body = `
    <div class="card">
      <h3>${labels.summaryTitle}</h3>
      <div class="message-box">
        <strong>${labels.reasonTitle}</strong><br />
        ${reason}
      </div>
    </div>
    <div class="card">
      <h3>${labels.nextStepsTitle}</h3>
      <ul style="padding-${locale === 'ar' ? 'right' : 'left'}:20px;margin:0;">
        ${stepsList}
      </ul>
    </div>
  `;

  return wrapEmail(locale, labels.heading, labels.description, body);
}

