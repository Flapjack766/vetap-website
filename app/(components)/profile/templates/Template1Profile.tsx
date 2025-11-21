'use client';

import Image from 'next/image';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Github,
  Link as LinkIcon,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { LinkTracker } from '../LinkTracker';

interface Template1ProfileProps {
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
  default: LinkIcon,
};

export function Template1Profile({ profile, locale }: Template1ProfileProps) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Classic Card Layout */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Profile'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-5xl md:text-6xl font-bold text-primary-foreground">
                        {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
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
            </div>

            {/* Contact Info */}
            {(profile.email || profile.phone || profile.location) && (
              <div className="p-6 md:p-8 border-t border-border bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <a 
                        href={`mailto:${profile.email}`}
                        className="text-sm hover:text-primary transition-colors truncate"
                      >
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <a 
                        href={`tel:${profile.phone}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {profile.phone}
                      </a>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links Section */}
            {Object.keys(links).length > 0 && (
              <div className="p-6 md:p-8 border-t border-border">
                <h2 className="text-xl font-bold mb-6">Links</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(links).map(([key, url]) => {
                    if (!url || typeof url !== 'string') return null;
                    
                    const Icon = getLinkIcon(key);
                    const label = getLinkLabel(key, url);
                    
                    let href = url;
                    if (key.toLowerCase() === 'whatsapp') {
                      const phone = url.replace(/[^0-9]/g, '');
                      href = `https://wa.me/${phone}`;
                    } else if (key.toLowerCase() === 'email') {
                      href = `mailto:${url}`;
                    } else if (key.toLowerCase() === 'phone') {
                      href = `tel:${url}`;
                    } else if (!url.startsWith('http')) {
                      href = `https://${url}`;
                    }

                    return (
                      <LinkTracker
                        key={key}
                        profileId={profile.id}
                        linkUrl={href}
                        linkType={key.toLowerCase()}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4 group hover:bg-primary hover:text-primary-foreground transition-colors"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

