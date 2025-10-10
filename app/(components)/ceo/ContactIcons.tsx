'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, Twitter, Instagram, Copy, Check } from 'lucide-react';
import { ceoData } from '@/lib/ceo/data';
import { Button } from '../ui/button';

export function ContactIcons({ locale }: { locale: 'ar' | 'en' }) {
  const t = useTranslations();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const contactMethods = [
    {
      id: 'email1',
      icon: Mail,
      label: ceoData.emails[0],
      href: `mailto:${ceoData.emails[0]}`,
      copyText: ceoData.emails[0],
    },
    {
      id: 'email2',
      icon: Mail,
      label: ceoData.emails[1],
      href: `mailto:${ceoData.emails[1]}`,
      copyText: ceoData.emails[1],
    },
    {
      id: 'phone1',
      icon: Phone,
      label: ceoData.phones[0],
      href: `tel:${ceoData.phones[0]}`,
      copyText: ceoData.phones[0],
    },
    {
      id: 'phone2',
      icon: Phone,
      label: ceoData.phones[1],
      href: `tel:${ceoData.phones[1]}`,
      copyText: ceoData.phones[1],
    },
    {
      id: 'whatsapp1',
      icon: MessageCircle,
      label: `WhatsApp ${ceoData.phones[0]}`,
      href: ceoData.whatsapp[0].link,
      copyText: ceoData.phones[0],
      external: true,
    },
    {
      id: 'whatsapp2',
      icon: MessageCircle,
      label: `WhatsApp ${ceoData.phones[1]}`,
      href: ceoData.whatsapp[1].link,
      copyText: ceoData.phones[1],
      external: true,
    },
  ];

  const socialLinks = [
    { id: 'twitter', icon: Twitter, label: t('A211'), href: ceoData.social.twitter.url },
    { id: 'instagram', icon: Instagram, label: t('A212'), href: ceoData.social.instagram.url },
    { id: 'snapchat', icon: MessageCircle, label: t('A213'), href: ceoData.social.snapchat.url },
  ];

  return (
    <section className="vetap-section">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold">{t('A238')}</h2>
        </motion.div>

        <div className="mx-auto max-w-4xl space-y-8">
          {/* Contact Methods */}
          <div className="vetap-card">
            <h3 className="mb-6 text-xl font-semibold">{t('A227')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                const isCopied = copiedItem === method.id;
                return (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                  >
                    <a
                      href={method.href}
                      target={method.external ? '_blank' : undefined}
                      rel={method.external ? 'noopener noreferrer' : undefined}
                      className="flex flex-1 items-center gap-3 transition-colors hover:text-primary"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{method.label}</span>
                    </a>
                    <button
                      onClick={() => copyToClipboard(method.copyText, method.id)}
                      className="rounded-md p-2 transition-colors hover:bg-accent"
                      aria-label={t('A215')}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Social Links */}
          <div className="vetap-card">
            <h3 className="mb-6 text-xl font-semibold">{t('A239')}</h3>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.id}
                    asChild
                    variant="outline"
                    className="gap-2"
                  >
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4" />
                      {social.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

