'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Mail, Phone, Download } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

type Locale = 'ar' | 'en' | 'tr';

export type CaptainLocaleData = {
  name: string;
  rank: string;
  fleet: string;
  employer: string;
  about: string;
  safety: string[];
  certs: string[];
  aircraftHours: { types: string[]; total: string; currentType: string; ifr: string; vfr: string };
  timeline: { year: string; desc: string }[];
  contacts: { email?: string; whatsapp?: string; linkedin?: string; website?: string };
  disclaimer: string;
  base: string;
  languages: string[];
  photoUrl?: string;
};

export function CaptainView({ locale, handle, data }: { locale: Locale; handle: string; data: CaptainLocaleData }) {
  const isRtl = locale === 'ar';

  const whatsappHref = data.contacts.whatsapp ? `https://wa.me/${data.contacts.whatsapp}` : undefined;
  const mailHref = data.contacts.email ? `mailto:${data.contacts.email}` : undefined;
  const telHref = undefined as string | undefined;
  const vcardHref = `/${locale}/cards/${handle}/vcard`;

  return (
    <div className={isRtl ? 'rtl' : ''} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero (mirrors CEO styling) */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              {/* Image */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="order-1 md:order-1">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                  {data.photoUrl && (
                    <Image src={data.photoUrl} alt={data.name} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
                  )}
                </div>
              </motion.div>

              {/* Info */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="order-2 md:order-2">
                <p className="mb-2 text-sm font-medium text-primary">Captain — {data.fleet}</p>
                <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">{data.name}</h1>
                <p className="mb-1 text-muted-foreground">{data.rank}</p>
                <p className="mb-6 text-sm text-muted-foreground">{data.employer}</p>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  {whatsappHref && (
                    <Button asChild size="lg" className="gap-2">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-5 w-5" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  {mailHref && (
                    <Button asChild size="lg" variant="outline" className="gap-2">
                      <a href={mailHref}>
                        <Mail className="h-5 w-5" /> Email
                      </a>
                    </Button>
                  )}
                  {telHref && (
                    <Button asChild size="lg" variant="outline" className="gap-2">
                      <a href={telHref}>
                        <Phone className="h-5 w-5" /> Call
                      </a>
                    </Button>
                  )}
                  <Button asChild size="lg" variant="secondary" className="gap-2">
                    <Link href={vcardHref}>
                      <Download className="h-5 w-5" /> Save Contact
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Employer */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="vetap-card text-sm text-muted-foreground">{data.employer}</div>
        </div>
      </section>

      {/* About */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-center text-3xl font-bold">About the Captain</h2>
            <div className="vetap-card">
              <p className="text-lg leading-relaxed text-muted-foreground">{data.about}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Safety & Certificates */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="vetap-card">
              <h3 className="mb-3 text-xl font-semibold">Safety & Operational Discipline</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {data.safety.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="vetap-card">
              <h3 className="mb-3 text-xl font-semibold">Certificates & Licenses</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {data.certs.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Types & Hours */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="vetap-card">
            <h3 className="mb-4 text-xl font-semibold">Aircraft Types & Flight Hours</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Types</h4>
                <div className="flex flex-wrap gap-2">
                  {data.aircraftHours.types.map((t, i) => (
                    <span key={i} className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Hours</h4>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Total</span><span>{data.aircraftHours.total}</span></div>
                  <div className="flex items-center justify-between"><span>Current</span><span>{data.aircraftHours.currentType}</span></div>
                  <div className="flex items-center justify-between"><span>IFR</span><span>{data.aircraftHours.ifr}</span></div>
                  <div className="flex items-center justify-between"><span>VFR</span><span>{data.aircraftHours.vfr}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Professional Record</h2>
          </motion.div>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-8">
              {data.timeline.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">{m.year}</span>
                    </div>
                    {i < data.timeline.length - 1 && <div className="mt-2 h-full w-0.5 bg-border" />}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-lg font-semibold text-foreground">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Legal */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="vetap-card">
              <h3 className="mb-3 text-xl font-semibold">Professional Contact</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {data.contacts.email && (
                  <div className="flex items-center justify-between"><span>Email</span><a className="text-primary" href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a></div>
                )}
                {data.contacts.linkedin && (
                  <div className="flex items-center justify-between"><span>LinkedIn</span><a className="text-primary" href={data.contacts.linkedin} target="_blank">Open</a></div>
                )}
                {data.contacts.website && (
                  <div className="flex items-center justify-between"><span>Website</span><a className="text-primary" href={data.contacts.website} target="_blank">Open</a></div>
                )}
              </div>
            </div>
            <div className="vetap-card text-xs text-muted-foreground">
              {data.disclaimer}
              <p className="mt-2 opacity-70">Logo allowed only within Employer card, small, grayscale, with disclaimer.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


