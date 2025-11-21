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
import { LinkTracker } from '../LinkTracker';

interface Template2ProfileProps {
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

export function Template2Profile({ profile, locale }: Template2ProfileProps) {
  const isRTL = locale === 'ar';
  const links = typeof profile.links === 'string' 
    ? JSON.parse(profile.links || '{}') 
    : (profile.links || {});

  const getLinkIcon = (key: string) => {
    const normalizedKey = key.toLowerCase();
    return linkIcons[normalizedKey] || linkIcons.default;
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-12">
        {/* Minimal Header */}
        <div className="text-center space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || 'Profile'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-medium text-muted-foreground">
                  {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <h1 className="text-3xl font-medium mb-2">
              {profile.display_name || profile.email || 'Anonymous'}
            </h1>
            {profile.headline && (
              <p className="text-muted-foreground text-lg">
                {profile.headline}
              </p>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Minimal Links */}
        {Object.keys(links).length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(links).map(([key, url]) => {
              if (!url || typeof url !== 'string') return null;
              
              const Icon = getLinkIcon(key);
              const href = getLinkHref(key, url);

              return (
                <LinkTracker
                  key={key}
                  profileId={profile.id}
                  linkUrl={href}
                  linkType={key.toLowerCase()}
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 w-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                    aria-label={key}
                  >
                    <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </a>
                </LinkTracker>
              );
            })}
          </div>
        )}

        {/* Minimal Contact */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
                <Mail className="h-4 w-4" />
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
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </a>
            </LinkTracker>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

