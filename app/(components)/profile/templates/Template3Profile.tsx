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
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { LinkTracker } from '../LinkTracker';

interface Template3ProfileProps {
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
  default: ExternalLink,
};

export function Template3Profile({ profile, locale }: Template3ProfileProps) {
  const isRTL = locale === 'ar';
  const links = typeof profile.links === 'string' 
    ? JSON.parse(profile.links || '{}') 
    : (profile.links || {});

  const getLinkIcon = (key: string) => {
    const normalizedKey = key.toLowerCase();
    return linkIcons[normalizedKey] || linkIcons.default;
  };

  const getLinkLabel = (key: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      twitter: 'Twitter',
      x: 'X',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      youtube: 'YouTube',
      github: 'GitHub',
      website: 'Website',
      email: 'Email',
      phone: 'Phone',
    };
    return labels[key.toLowerCase()] || key;
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card-based Layout */}
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header with Avatar */}
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 pb-16">
            <div className="flex justify-center -mb-12">
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-card shadow-xl">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Profile'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-4xl font-bold text-primary-foreground">
                    {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="pt-16 px-6 pb-6 space-y-6">
            {/* Name & Headline */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1">
                {profile.display_name || profile.email || 'Anonymous'}
              </h1>
              {profile.headline && (
                <p className="text-muted-foreground text-sm">
                  {profile.headline}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Contact Cards */}
            <div className="space-y-2">
              {profile.email && (
                <LinkTracker
                  profileId={profile.id}
                  linkUrl={`mailto:${profile.email}`}
                  linkType="email"
                >
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <a 
                      href={`mailto:${profile.email}`}
                      className="text-sm hover:text-primary transition-colors truncate"
                    >
                      {profile.email}
                    </a>
                  </div>
                </LinkTracker>
              )}
              {profile.phone && (
                <LinkTracker
                  profileId={profile.id}
                  linkUrl={`tel:${profile.phone}`}
                  linkType="phone"
                >
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <a 
                      href={`tel:${profile.phone}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {profile.phone}
                    </a>
                  </div>
                </LinkTracker>
              )}
              {profile.location && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>

            {/* Links */}
            {Object.keys(links).length > 0 && (
              <div className="space-y-2">
                {Object.entries(links).map(([key, url]) => {
                  if (!url || typeof url !== 'string') return null;
                  
                  const Icon = getLinkIcon(key);
                  const label = getLinkLabel(key);
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
                        className="w-full justify-start h-auto py-3 group hover:bg-primary hover:text-primary-foreground transition-colors"
                        asChild
                      >
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{label}</span>
                        </a>
                      </Button>
                    </LinkTracker>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

