'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Mail, Linkedin } from 'lucide-react';

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: t('A172'), // Quick Links
      links: [
        { href: '/services', label: t('A3') },
        // { href: '/portfolio', label: t('A4') }, // مخفي مؤقتاً
        { href: '/about', label: t('A5') },
        { href: '/contact', label: t('A6') },
      ],
    },
    {
      title: t('A173'), // Resources
      links: [
        { href: '/blog', label: t('A174') }, // Blog
        { href: '/documentation', label: t('A175') }, // Documentation
        { href: '/support', label: t('A176') }, // Support
      ],
    },
    {
      title: t('A177'), // Privacy Policy (using as Legal header)
      links: [
        { href: '/privacy', label: t('A177') }, // Privacy Policy
        { href: '/terms', label: t('A178') }, // Terms of Service
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="vetap-container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" prefetch={true} className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image
                src="/icons/logo.png"
                alt="VETAP Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-2xl font-bold tracking-tight">VETAP</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t('A2')}</p>
            <div className="flex gap-4">
              <a
                href="mailto:info@vetaps.com"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/vetap_official"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="X"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/vetap"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((section, sectionIndex) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={`${sectionIndex}-${linkIndex}-${link.label}`}>
                    <Link
                      href={link.href}
                      prefetch={link.href !== '#'}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              {t('A199')} © {currentYear} VETAP. {t('A36')}
            </p>
            <p className="text-sm text-muted-foreground">{t('A200')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

