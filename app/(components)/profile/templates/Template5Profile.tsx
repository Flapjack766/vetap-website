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

interface Template5ProfileProps {
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

export function Template5Profile({ profile, locale }: Template5ProfileProps) {
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
    <div className="min-h-screen relative">
      {/* Full-screen Hero Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-background -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] -z-10" />

      {/* Full-screen Hero Content */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Profile'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-6xl md:text-7xl font-bold text-primary-foreground">
                    {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name & Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">
                {profile.display_name || profile.email || 'Anonymous'}
              </h1>
              {profile.headline && (
                <p className="text-2xl md:text-3xl text-muted-foreground">
                  {profile.headline}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              {profile.email && (
                <LinkTracker
                  profileId={profile.id}
                  linkUrl={`mailto:${profile.email}`}
                  linkType="email"
                >
                  <a 
                    href={`mailto:${profile.email}`}
                    className="hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    <span>{profile.email}</span>
                  </a>
                </LinkTracker>
              )}
              {profile.phone && (
                <LinkTracker
                  profileId={profile.id}
                  linkUrl={`tel:${profile.phone}`}
                  linkType="phone"
                >
                  <a 
                    href={`tel:${profile.phone}`}
                    className="hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{profile.phone}</span>
                  </a>
                </LinkTracker>
              )}
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links Grid */}
          {Object.keys(links).length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Links</h2>
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
                        size="lg"
                        className="w-full justify-start h-auto py-6 px-6 group hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all border-2"
                        asChild
                      >
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-6 w-6 mr-4 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-lg">{label}</span>
                        </a>
                      </Button>
                    </LinkTracker>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

