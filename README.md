# VETAP — Professional Website Design & Engineering

A modern, high-performance landing website built with Next.js 15, TypeScript, and Tailwind CSS. Features complete internationalization (i18n), ultra-pro SEO optimization, and a beautiful dark-themed UI.

## 🚀 Features

- **⚡ Lightning-fast Performance**: Built with Next.js 15 and optimized for speed
- **🌍 Internationalization**: Full i18n support with Arabic and English translations
- **🔍 Ultra Pro SEO**: Comprehensive SEO with metadata, Open Graph, JSON-LD, sitemap, and robots.txt
- **🎨 Modern UI**: Beautiful dark theme with Tailwind CSS and Framer Motion animations
- **🔒 Security-first**: CSP headers, rate limiting, input sanitization
- **📱 Fully Responsive**: Optimized for all devices and screen sizes
- **♿ Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **📧 Contact Form**: Integrated with Resend for email notifications with ticket system
- **🎯 Interactive Demo**: HeroShowcase with 3-step questionnaire for personalized recommendations

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Internationalization**: next-intl
- **Email**: Resend
- **Validation**: Zod

## 📁 Project Structure

```
├── app/
│   ├── [locale]/              # Localized routes
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home page
│   │   ├── services/
│   │   ├── portfolio/
│   │   ├── about/
│   │   └── contact/
│   ├── (components)/          # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroShowcase.tsx
│   │   └── ...
│   ├── (seo)/                 # SEO configuration
│   └── api/contact/           # Contact form API
├── content/                   # Translation files
│   ├── ar.json
│   └── en.json
├── lib/                       # Utilities
│   ├── i18n/
│   ├── utils.ts
│   ├── security.ts
│   ├── mail.ts
│   └── ticket.ts
├── styles/                    # Global styles
│   ├── globals.css
│   └── themes.css
└── middleware.ts              # i18n and security middleware
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vetap-website
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in the environment variables in `.env.local`:
   ```env
   RESEND_API_KEY=your_resend_api_key
   COMPANY_EMAIL=support@vetaps.com
   COMPANY_NAME=VETAP
   FROM_EMAIL="VETAP <no-reply@vetaps.com>"
   SITE_URL=https://vetaps.com
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Build for Production

```bash
npm run build
npm run start
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## 🌐 Internationalization

The website supports multiple languages through next-intl. All translations are stored in JSON files using keys A1-A200:

- `content/en.json` - English translations
- `content/ar.json` - Arabic translations

To add a new language:
1. Create a new JSON file in `content/` (e.g., `fr.json`)
2. Add the locale to `lib/i18n/config.ts`
3. Add translations for all A1-A200 keys

## 📧 Contact Form

The contact form is integrated with Resend and includes:

- Client-side validation
- Rate limiting (3 requests per minute per IP)
- Automatic ticket generation (VTP-YYYYMMDD-XXXX)
- Dual email sending:
  - Confirmation email to client
  - Notification email to company
- HTML email templates matching brand identity
- RTL support for Arabic emails

## 🔒 Security Features

- Content Security Policy (CSP) headers
- Rate limiting on API endpoints
- Input sanitization
- XSS prevention
- Secure HTTP headers (HSTS, X-Frame-Options, etc.)

## ⚡ Performance Optimizations

- Static Site Generation (SSG)
- Optimized images with Next/Image
- Code splitting
- Lazy loading
- Prefetching
- Target: LCP < 1.8s on 4G

## 📊 SEO Features

- Comprehensive metadata
- Open Graph tags
- Twitter Card tags
- JSON-LD structured data (Organization, WebSite, Service, BreadcrumbList)
- XML sitemap with language alternates
- Robots.txt
- Canonical URLs
- hreflang tags for internationalization

## 🎨 Design System

- **Colors**: Black/White + Titanium shades
- **Spacing**: Wide white spaces for clean design
- **Typography**: System UI fonts with Arabic fallbacks
- **Animations**: Framer Motion with 180-220ms transitions
- **Components**: shadcn/ui based components

## 📝 License

All rights reserved © VETAP

## 🤝 Contact

For inquiries, please visit [https://vetaps.com/contact](https://vetaps.com/contact)

---

Made with ❤️ by VETAP

