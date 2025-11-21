'use client';

import Image from 'next/image';
import { 
  Mail, 
  Phone, 
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Github,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { LinkTracker } from '../LinkTracker';

interface Template4ProfileProps {
  profile: any;
  locale: string;
}

const linkIcons: Record<string, any> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
  website: Globe,
  email: Mail,
  phone: Phone,
  default: Globe,
};

export function Template4Profile({ profile, locale }: Template4ProfileProps) {
  const isRTL = locale === 'ar';
  const links = typeof profile.links === 'string' 
    ? JSON.parse(profile.links || '{}') 
    : (profile.links || {});

  const getLinkIcon = (key: string) => {
    const normalizedKey = key.toLowerCase();
    return linkIcons[normalizedKey] || linkIcons.default;
  };

  const getLinkLabel = (key: string, url: string) => {
    if (key.toLowerCase() === 'whatsapp') return 'WhatsApp';
    if (key.toLowerCase() === 'email') return 'Email';
    if (key.toLowerCase() === 'phone') return 'Phone';
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return key;
    }
  };

  const getLinkHref = (key: string, url: string) => {
    if (key.toLowerCase() === 'whatsapp') {
      const phone = url.replace(/[^0-9]/g, '');
      return `https://wa.me/${phone}`;
    }
    if (key.toLowerCase() === 'email') return `mailto:${url}`;
    if (key.toLowerCase() === 'phone') return `tel:${url}`;
    if (!url.startsWith('http')) return `https://${url}`;
    return url;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-5xl">
          {/* Sections Layout */}
          <div className="space-y-8">
            {/* About Section */}
            <section className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative flex-shrink-0">
                  <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-2xl overflow-hidden border-2 border-border shadow-lg">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Profile'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-5xl font-bold text-primary-foreground">
                        {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    {profile.display_name || profile.email || 'Anonymous'}
                  </h1>
                  {profile.headline && (
                    <p className="text-xl text-muted-foreground mb-4">
                      {profile.headline}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            {(profile.email || profile.phone || profile.location) && (
              <section className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {profile.email && (
                    <LinkTracker
                      profileId={profile.id}
                      linkUrl={`mailto:${profile.email}`}
                      linkType="email"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <a 
                            href={`mailto:${profile.email}`}
                            className="text-sm font-medium hover:text-primary transition-colors break-all"
                          >
                            {profile.email}
                          </a>
                        </div>
                      </div>
                    </LinkTracker>
                  )}
                  {profile.phone && (
                    <LinkTracker
                      profileId={profile.id}
                      linkUrl={`tel:${profile.phone}`}
                      linkType="phone"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone</p>
                          <a 
                            href={`tel:${profile.phone}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {profile.phone}
                          </a>
                        </div>
                      </div>
                    </LinkTracker>
                  )}
                  {profile.location && (
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Location</p>
                        <p className="text-sm font-medium">{profile.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Links Section */}
            {Object.keys(links).length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Links</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(links).map(([key, url]) => {
                    if (!url || typeof url !== 'string') return null;
                    
                    const Icon = getLinkIcon(key);
                    const label = getLinkLabel(key, url);
                    const href = getLinkHref(key, url);

                    return (
                      <LinkTracker
                        key={key}
                        profileId={profile.id}
                        linkUrl={href}
                        linkType={key.toLowerCase()}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-4 px-6 group hover:bg-primary hover:text-primary-foreground transition-colors"
                          asChild
                        >
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            <Icon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">{label}</span>
                          </a>
                        </Button>
                      </LinkTracker>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

