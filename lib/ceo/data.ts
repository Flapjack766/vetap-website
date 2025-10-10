export const ceoData = {
  name: {
    en: 'Ahmed Alzbaji',
    ar: 'أحمد الزباجي',
  },
  title: {
    en: 'Founder & CEO',
    ar: 'مؤسس و الرئيس التنفيذي',
  },
  emails: [
    'Ahmed@vetaps.com',
    'ceo@vetaps.com',
  ],
  phones: [
    '+966553198577',
    '+905314615973',
  ],
  whatsapp: [
    { number: '+966553198577', link: 'https://wa.me/966553198577' },
    { number: '+905314615973', link: 'https://wa.me/905314615973' },
  ],
  social: {
    instagram: { username: 'ictfe', url: 'https://instagram.com/ictfe' },
    snapchat: { username: 'hmood-az', url: 'https://www.snapchat.com/add/hmood-az' },
    twitter: { username: 'ahmedalzbaji', url: 'https://x.com/ahmedalzbaji' },
  },
  company: {
    name: 'VETAP',
    url: 'https://www.vetaps.com',
  },
  vcardUrl: '/ceo/vcard.vcf',
  image: '/images/ceo.jpg',
};

export function getMailtoLink(email: string, locale: 'ar' | 'en' = 'en'): string {
  const subject = locale === 'ar' 
    ? 'استفسار من موقع VETAP' 
    : 'Inquiry from VETAP Website';
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

export function getTelLink(phone: string): string {
  return `tel:${phone}`;
}

export function getWhatsAppLink(phone: string, locale: 'ar' | 'en' = 'en'): string {
  const message = locale === 'ar'
    ? 'مرحباً أحمد، أود التواصل معك من موقع VETAP'
    : 'Hello Ahmed, I would like to connect with you from VETAP website';
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
}

