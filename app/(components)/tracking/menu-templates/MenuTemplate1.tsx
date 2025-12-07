'use client';

import { Button } from '@/app/(components)/ui/button';
import { Phone, MessageCircle, MapPin, Clock, ExternalLink, Utensils, Star } from 'lucide-react';
import Image from 'next/image';

/**
 * Menu Template 1 - Simple Menu Display
 * 
 * A clean template focused on menu display with business info
 */

export interface MenuTemplateProps {
  // Business Info
  businessName: string;
  branchName?: string;
  
  // Images
  logo?: string;
  coverImage?: string;
  
  // Contact Info
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  
  // Operating Hours
  operatingHours?: {
    [key: string]: string;
  } | string;
  
  // Menu
  menuItems?: Array<{
    name: string;
    description?: string;
    price?: string;
    image?: string;
    category?: string;
  }>;
  menuImage?: string; // Full menu image
  externalMenuUrl?: string; // External menu URL (if menu is hosted elsewhere)
  
  // CTA
  destinationUrl: string;
  onContinue: () => void;
  
  // Optional
  description?: string;
  address?: string;

  // Visual variant (1-5) to differentiate menu templates
  templateVariant?: number;
}

export function MenuTemplate1({
  businessName,
  branchName,
  logo,
  coverImage,
  phone,
  whatsapp,
  googleMapsUrl,
  operatingHours,
  menuItems,
  menuImage,
  externalMenuUrl,
  destinationUrl,
  onContinue,
  description,
  address,
  templateVariant = 1,
}: MenuTemplateProps) {
  const formatHours = (hours: MenuTemplateProps['operatingHours']): string => {
    if (!hours) return '';
    if (typeof hours === 'string') return hours;
    return Object.entries(hours)
      .map(([day, time]) => `${day}: ${time}`)
      .join('\n');
  };

  const headerGradient =
    templateVariant === 2
      ? 'from-amber-500 via-orange-500 to-red-500'
      : templateVariant === 3
      ? 'from-emerald-500 via-teal-500 to-cyan-500'
      : templateVariant === 4
      ? 'from-slate-800 via-slate-900 to-black'
      : templateVariant === 5
      ? 'from-fuchsia-500 via-purple-500 to-indigo-500'
      : 'from-primary/20 to-primary/5';

  const layoutVariant =
    templateVariant === 3 || templateVariant === 5 ? 'md:grid-cols-[2fr,1fr]' : 'md:grid-cols-2';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`relative h-48 md:h-64 w-full overflow-hidden bg-gradient-to-br ${headerGradient}`}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={businessName}
            fill
            className="object-cover"
            priority
          />
        ) : null}
        
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative z-10 container mx-auto px-4 py-6 h-full flex flex-col justify-center items-center text-center">
          {logo && (
            <div className="mb-4">
              <Image
                src={logo}
                alt={`${businessName} Logo`}
                width={100}
                height={100}
                className="object-contain bg-background/90 rounded-lg p-2"
              />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{businessName}</h1>
          {branchName && (
            <p className="text-white/90">{branchName}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Description */}
        {description && (
          <p className="text-center text-muted-foreground mb-6">{description}</p>
        )}

        {/* Menu Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Our Menu</h2>
          </div>

          {/* External Menu Link */}
          {externalMenuUrl && (
            <div className="mb-6 flex justify-center">
              <Button
                size="lg"
                onClick={() => window.open(externalMenuUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Menu
              </Button>
            </div>
          )}

          {/* Full Menu Image */}
          {menuImage && !externalMenuUrl && (
            <div className="mb-6 rounded-lg overflow-hidden border">
              <Image
                src={menuImage}
                alt={`${businessName} Menu`}
                width={800}
                height={1200}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {/* Menu Items List */}
          {menuItems && menuItems.length > 0 && !externalMenuUrl && (
            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-card rounded-lg border"
                >
                  {item.image && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {item.category && (
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        {item.category}
                      </p>
                    )}
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}
                    {item.price && (
                      <p className="text-lg font-bold text-primary">{item.price}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={`grid ${layoutVariant} gap-4 mb-6`}>
          {/* Address */}
          {address && (
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Location</p>
                <p className="text-sm text-muted-foreground">{address}</p>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          {operatingHours && (
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
              <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Operating Hours</p>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {formatHours(operatingHours)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {phone && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`tel:${phone}`, '_blank')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Us
            </Button>
          )}
          {whatsapp && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
        </div>

        {/* Google Maps Review Button */}
        {googleMapsUrl && (
          <Button
            variant="default"
            size="lg"
            className="w-full mb-6"
            onClick={() => window.open(googleMapsUrl, '_blank')}
          >
            <Star className="h-4 w-4 mr-2" />
            Rate Us on Google Maps
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Continue Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          Continue to Destination
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

