'use client';

import { Button } from '@/app/(components)/ui/button';
import { Phone, MessageCircle, MapPin, Clock, ExternalLink, Star, Utensils, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import Image from 'next/image';

export interface RestaurantTemplateProps {
  businessName: string;
  branchName?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  operatingHours?: Record<string, string> | string;
  destinationUrl: string;
  onContinue: () => void;
  description?: string;
  address?: string;
  templateVariant?: number;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  heroOverlayColor?: string;
  pageBackgroundImage?: string;
  menuPageUrl?: string;
  showMap?: boolean;
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
}

type TemplateColors = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  heroOverlay: string;
};

const COLOR_DEFAULTS: Record<number, TemplateColors> = {
  1: { primary: '#2563eb', accent: '#f97316', background: '#f8fafc', text: '#0f172a', heroOverlay: 'rgba(0,0,0,0.2)' },
  2: { primary: '#fbbf24', accent: '#f97316', background: '#1c1917', text: '#fef3c7', heroOverlay: 'rgba(0,0,0,0.55)' },
  3: { primary: '#059669', accent: '#84cc16', background: '#ecfdf5', text: '#064e3b', heroOverlay: 'rgba(0,0,0,0.25)' },
  4: { primary: '#f8fafc', accent: '#94a3b8', background: '#020617', text: '#f8fafc', heroOverlay: 'rgba(0,0,0,0.6)' },
  5: { primary: '#d946ef', accent: '#6366f1', background: '#fdf2f8', text: '#111827', heroOverlay: 'rgba(0,0,0,0.3)' },
};

const getReadableTextColor = (color: string) => {
  if (!color?.startsWith('#')) return '#ffffff';
  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#111827' : '#ffffff';
};

export function RestaurantTemplate1({
  businessName,
  branchName,
  logo,
  coverImage,
  phone,
  whatsapp,
  googleMapsUrl,
  operatingHours,
  destinationUrl,
  onContinue,
  description,
  address,
  templateVariant = 1,
  primaryColor,
  accentColor,
  backgroundColor,
  textColor,
  heroOverlayColor,
  pageBackgroundImage,
  menuPageUrl,
  showMap = false,
  socialMediaLinks,
}: RestaurantTemplateProps) {
  const formatHours = (hours?: Record<string, string> | string) => {
    if (!hours) return '';
    if (typeof hours === 'string') return hours;
    return Object.entries(hours)
      .map(([day, time]) => `${day}: ${time}`)
      .join('\n');
  };

  const defaults = COLOR_DEFAULTS[templateVariant] ?? COLOR_DEFAULTS[1];
  const colors: TemplateColors = {
    primary: primaryColor || defaults.primary,
    accent: accentColor || defaults.accent,
    background: backgroundColor || defaults.background,
    text: textColor || defaults.text,
    heroOverlay: heroOverlayColor || defaults.heroOverlay,
  };

  const pageStyle = pageBackgroundImage
    ? {
        backgroundImage: `url(${pageBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: colors.text,
      }
    : { backgroundColor: colors.background, color: colors.text };

  const heroOverlayStyle = { backgroundColor: colors.heroOverlay };
  const primaryButtonStyle = {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: getReadableTextColor(colors.primary),
  };
  const accentButtonStyle = {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    color: getReadableTextColor(colors.accent),
  };
  const outlineButtonStyle = (color: string) => ({
    backgroundColor: 'transparent',
    borderColor: color,
    color,
  });

  const renderHero = (heightClass: string, containerClass = 'relative') => (
    <div className={`${containerClass} w-full overflow-hidden ${heightClass}`}>
      {coverImage ? (
        <Image src={coverImage} alt={businessName} fill className="object-cover" priority />
      ) : (
        <div
          className="w-full h-full"
          style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
        />
      )}
      <div className="absolute inset-0" style={heroOverlayStyle} />
    </div>
  );

  const renderContactButtons = () => (
    <div className="flex flex-col gap-3">
      {phone && (
        <Button className="w-full" style={primaryButtonStyle} onClick={() => window.open(`tel:${phone}`, '_blank')}>
          <Phone className="h-4 w-4 mr-2" /> Call
        </Button>
      )}
      {whatsapp && (
        <Button
          className="w-full"
          style={accentButtonStyle}
          onClick={() => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank')}
        >
          <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
        </Button>
      )}
      {googleMapsUrl && (
        <Button
          className="w-full"
          variant="outline"
          style={outlineButtonStyle(colors.accent)}
          onClick={() => window.open(googleMapsUrl, '_blank')}
        >
          <Star className="h-4 w-4 mr-2" /> Google Maps
        </Button>
      )}
    </div>
  );

  const renderMenuButton = () => {
    if (!menuPageUrl) return null;
    return (
      <Button
        className="w-full"
        size="lg"
        style={accentButtonStyle}
        onClick={() => window.open(menuPageUrl, '_blank')}
      >
        <Utensils className="h-4 w-4 mr-2" /> View Menu
      </Button>
    );
  };

  const renderMap = () => {
    if (!showMap || !googleMapsUrl) return null;
    
    // Convert Google Maps URL to embed format
    let embedUrl = googleMapsUrl;
    
    // Extract coordinates from URL if available
    const coordMatch = googleMapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      const [, lat, lng] = coordMatch;
      // Use Google Maps Embed API with coordinates
      embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v0!5m2!1sen!2sus`;
    } else if (googleMapsUrl.includes('/maps/place/')) {
      // Extract place name from URL
      const placeMatch = googleMapsUrl.match(/\/maps\/place\/([^/]+)/);
      if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        // Use Google Maps Embed API with place query
        embedUrl = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(placeName)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4uO3v5H0`;
      }
    } else if (address) {
      // Fallback: use address for embedding
      embedUrl = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(address)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4uO3v5H0`;
    } else {
      // Last resort: try to use the URL directly (may not work for all URL formats)
      embedUrl = googleMapsUrl.replace('/maps/', '/maps/embed?pb=');
    }

    return (
      <div className="w-full mt-12">
        <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: colors.text }}>
          Location
        </h2>
        <div className="w-full h-96 rounded-lg overflow-hidden border shadow-lg">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${businessName} Location`}
          />
        </div>
      </div>
    );
  };

  const renderSocialMedia = () => {
    if (!socialMediaLinks) return null;
    
    const socialLinks = [
      { key: 'facebook', url: socialMediaLinks.facebook, icon: Facebook, label: 'Facebook' },
      { key: 'instagram', url: socialMediaLinks.instagram, icon: Instagram, label: 'Instagram' },
      { key: 'twitter', url: socialMediaLinks.twitter, icon: Twitter, label: 'Twitter' },
      { key: 'linkedin', url: socialMediaLinks.linkedin, icon: Linkedin, label: 'LinkedIn' },
      { key: 'youtube', url: socialMediaLinks.youtube, icon: Youtube, label: 'YouTube' },
      { key: 'tiktok', url: socialMediaLinks.tiktok, icon: null, label: 'TikTok' },
    ].filter((link) => link.url);

    if (socialLinks.length === 0) return null;

    return (
      <div className="w-full mt-8">
        <h3 className="text-xl font-semibold mb-4 text-center" style={{ color: colors.text }}>
          Follow Us
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {socialLinks.map((social) => {
            if (social.key === 'tiktok') {
              // TikTok icon as SVG (lucide-react doesn't have it)
              return (
                <Button
                  key={social.key}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  style={outlineButtonStyle(colors.accent)}
                  onClick={() => window.open(social.url, '_blank')}
                  aria-label={social.label}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </Button>
              );
            }
            
            const Icon = social.icon!;
            return (
              <Button
                key={social.key}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                style={outlineButtonStyle(colors.accent)}
                onClick={() => window.open(social.url, '_blank')}
                aria-label={social.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderClassic = () => (
    <div className="min-h-screen" style={pageStyle}>
      {renderHero('h-64 md:h-80')}
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">{businessName}</h1>
          {branchName && <p className="opacity-80">{branchName}</p>}
          {description && <p className="opacity-75 text-sm md:text-base">{description}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {address && (
            <div className="rounded-2xl border bg-white/85 p-5 shadow-sm">
              <MapPin className="h-5 w-5 mb-2" style={{ color: colors.accent }} />
              <p className="font-semibold mb-1">Address</p>
              <p className="text-sm opacity-80">{address}</p>
            </div>
          )}
          {operatingHours && (
            <div className="rounded-2xl border bg-white/85 p-5 shadow-sm">
              <Clock className="h-5 w-5 mb-2" style={{ color: colors.accent }} />
              <p className="font-semibold mb-1">Hours</p>
              <pre className="text-sm whitespace-pre-wrap opacity-80">{formatHours(operatingHours)}</pre>
            </div>
          )}
          <div className="rounded-2xl border bg-white/85 p-5 shadow-sm flex flex-col gap-3">
            {renderContactButtons()}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {renderMenuButton()}
          <Button className="w-full" size="lg" style={primaryButtonStyle} onClick={onContinue}>
            Continue to Destination <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {renderSocialMedia()}
        {renderMap()}
      </div>
    </div>
  );

  const renderLuxe = () => (
    <div className="min-h-screen" style={pageStyle}>
      <div className="relative">
        {renderHero('h-[420px]')}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white">
          {logo && (
            <div className="mb-4 rounded-2xl bg-white/10 p-4 shadow-2xl">
              <Image src={logo} alt={`${businessName} Logo`} width={96} height={96} />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{businessName}</h1>
          {branchName && <p className="text-lg text-white/85">{branchName}</p>}
          {description && <p className="max-w-2xl text-white/80 mt-3">{description}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {address && (
              <div className="rounded-3xl border border-white/30 bg-black/40 p-6 backdrop-blur text-white">
                <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
                <p className="text-sm opacity-90">{address}</p>
              </div>
            )}
            {operatingHours && (
              <div className="rounded-3xl border border-white/30 bg-black/40 p-6 backdrop-blur text-white">
                <h3 className="text-xl font-semibold mb-2">Hours</h3>
                <pre className="text-sm whitespace-pre-wrap opacity-90">{formatHours(operatingHours)}</pre>
              </div>
            )}
          </div>
          <div className="space-y-4">{renderContactButtons()}</div>
        </div>
        <div className="mt-10 space-y-3">
          {renderMenuButton()}
          <Button className="w-full" size="lg" style={outlineButtonStyle('#ffffff')} variant="outline" onClick={onContinue}>
            Continue to Destination <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {renderSocialMedia()}
        {renderMap()}
      </div>
    </div>
  );

  const renderOrganic = () => (
    <div className="min-h-screen" style={pageStyle}>
      {renderHero('h-80')}
      <div className="-mt-12 relative z-10 container mx-auto px-4 max-w-5xl">
        <div className="rounded-[32px] bg-white shadow-2xl p-10 space-y-8">
          <div className="text-center space-y-2">
            <p className="uppercase tracking-[0.35em] text-xs opacity-70">Farm to Table</p>
            <h1 className="text-4xl font-semibold" style={{ color: colors.text }}>
              {businessName}
            </h1>
            {branchName && <p className="opacity-70">{branchName}</p>}
            {description && <p className="opacity-70 text-sm">{description}</p>}
          </div>
          <div className="grid md:grid-cols-[2fr,1fr] gap-8">
            <div className="space-y-4">
              {address && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
                  <p className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
                    Where to find us
                  </p>
                  <p className="text-sm opacity-80" style={{ color: colors.text }}>
                    {address}
                  </p>
                </div>
              )}
              {operatingHours && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-6">
                  <p className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
                    Opening hours
                  </p>
                  <pre className="text-sm whitespace-pre-wrap opacity-80" style={{ color: colors.text }}>
                    {formatHours(operatingHours)}
                  </pre>
                </div>
              )}
            </div>
            {renderContactButtons()}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-3">
        {renderMenuButton()}
        <Button className="w-full" size="lg" style={primaryButtonStyle} onClick={onContinue}>
          Continue to Destination <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
      {renderMap()}
    </div>
  );

  const renderNoir = () => (
    <div className="min-h-screen" style={pageStyle}>
      <div className="relative h-[420px]">
        {renderHero('h-full')}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          {logo && (
            <div className="mb-4 rounded-3xl bg-white/10 p-4 shadow-2xl">
              <Image src={logo} alt={`${businessName} Logo`} width={96} height={96} />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-1">{businessName}</h1>
          {branchName && <p className="text-white/75">{branchName}</p>}
          {description && <p className="text-white/70 mt-3 max-w-2xl">{description}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-5xl text-white">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {address && (
              <div className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Find us</p>
                <p className="text-sm text-white/85">{address}</p>
              </div>
            )}
            {operatingHours && (
              <div className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Hours</p>
                <pre className="text-sm whitespace-pre-wrap text-white/85">{formatHours(operatingHours)}</pre>
              </div>
            )}
          </div>
          <div className="space-y-4">{renderContactButtons()}</div>
        </div>
        <div className="mt-12 space-y-3">
          {renderMenuButton()}
          <Button className="w-full" size="lg" style={outlineButtonStyle('#ffffff')} variant="outline" onClick={onContinue}>
            Continue to Destination <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {renderSocialMedia()}
        {renderMap()}
      </div>
    </div>
  );

  const renderGradient = () => (
    <div className="min-h-screen" style={pageStyle}>
      <div className="relative h-[360px] flex items-center justify-center text-center px-4">
        {renderHero('h-full', 'absolute inset-0')}
        <div className="relative z-10 space-y-2 text-white max-w-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/80">Modern Dining</p>
          <h1 className="text-4xl md:text-5xl font-black">{businessName}</h1>
          {branchName && <p className="text-white/80">{branchName}</p>}
          {description && <p className="text-white/75">{description}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {address && (
              <div className="rounded-3xl border border-fuchsia-100 bg-white p-6 shadow-xl">
                <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-500 mb-2">Visit</p>
                <p className="text-sm text-slate-600">{address}</p>
              </div>
            )}
            {operatingHours && (
              <div className="rounded-3xl border border-fuchsia-100 bg-white p-6 shadow-xl">
                <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-500 mb-2">Hours</p>
                <pre className="text-sm text-slate-600 whitespace-pre-wrap">{formatHours(operatingHours)}</pre>
              </div>
            )}
          </div>
          <div className="space-y-4">{renderContactButtons()}</div>
        </div>
        <div className="mt-10 space-y-3">
          {renderMenuButton()}
          <Button className="w-full" size="lg" style={primaryButtonStyle} onClick={onContinue}>
            Continue to Destination <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {renderSocialMedia()}
        {renderMap()}
      </div>
    </div>
  );

  const renderers: Record<number, () => JSX.Element> = {
    1: renderClassic,
    2: renderLuxe,
    3: renderOrganic,
    4: renderNoir,
    5: renderGradient,
  };

  const renderTemplate = renderers[templateVariant] ?? renderClassic;

  return renderTemplate();
}
