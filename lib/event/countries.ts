/**
 * VETAP Event - Countries and Country Codes
 * 
 * List of countries with their codes for phone number selection
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2 code
  name: string; // Country name in English
  nameAr: string; // Country name in Arabic
  phoneCode: string; // Phone country code (e.g., +966)
  flag: string; // Flag emoji
}

export const countries: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', phoneCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', phoneCode: '+971', flag: '🇦🇪' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', phoneCode: '+965', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', phoneCode: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', phoneCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان', phoneCode: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', phoneCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', phoneCode: '+961', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', phoneCode: '+964', flag: '🇮🇶' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', phoneCode: '+963', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', phoneCode: '+967', flag: '🇾🇪' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', phoneCode: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', phoneCode: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', phoneCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', phoneCode: '+213', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', phoneCode: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', phoneCode: '+249', flag: '🇸🇩' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', phoneCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', phoneCode: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', phoneCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', phoneCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', phoneCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', phoneCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', phoneCode: '+61', flag: '🇦🇺' },
  { code: 'IN', name: 'India', nameAr: 'الهند', phoneCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان', phoneCode: '+92', flag: '🇵🇰' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', phoneCode: '+90', flag: '🇹🇷' },
  { code: 'IR', name: 'Iran', nameAr: 'إيران', phoneCode: '+98', flag: '🇮🇷' },
  { code: 'CN', name: 'China', nameAr: 'الصين', phoneCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان', phoneCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية', phoneCode: '+82', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل', phoneCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', nameAr: 'المكسيك', phoneCode: '+52', flag: '🇲🇽' },
  { code: 'RU', name: 'Russia', nameAr: 'روسيا', phoneCode: '+7', flag: '🇷🇺' },
];

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

/**
 * Get country by phone code
 */
export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return countries.find(c => c.phoneCode === phoneCode);
}

/**
 * Get country name based on locale
 */
export function getCountryName(country: Country, locale: string): string {
  return locale === 'ar' ? country.nameAr : country.name;
}

