/**
 * RTL utility functions for handling right-to-left layouts
 */

/**
 * Get RTL-aware margin classes
 * @param locale - Current locale ('ar' | 'en')
 * @param left - Left margin class (e.g., 'ml-2')
 * @param right - Right margin class (e.g., 'mr-2')
 * @returns Appropriate margin class based on locale
 */
export function getMarginClass(locale: string, left: string, right: string): string {
  return locale === 'ar' ? right : left;
}

/**
 * Get RTL-aware padding classes
 * @param locale - Current locale ('ar' | 'en')
 * @param left - Left padding class (e.g., 'pl-2')
 * @param right - Right padding class (e.g., 'pr-2')
 * @returns Appropriate padding class based on locale
 */
export function getPaddingClass(locale: string, left: string, right: string): string {
  return locale === 'ar' ? right : left;
}

/**
 * Get RTL-aware text alignment
 * @param locale - Current locale ('ar' | 'en')
 * @param left - Left alignment class (e.g., 'text-left')
 * @param right - Right alignment class (e.g., 'text-right')
 * @returns Appropriate text alignment class based on locale
 */
export function getTextAlignClass(locale: string, left: string, right: string): string {
  return locale === 'ar' ? right : left;
}

/**
 * Get RTL-aware position classes
 * @param locale - Current locale ('ar' | 'en')
 * @param left - Left position class (e.g., 'left-2')
 * @param right - Right position class (e.g., 'right-2')
 * @returns Appropriate position class based on locale
 */
export function getPositionClass(locale: string, left: string, right: string): string {
  return locale === 'ar' ? right : left;
}

/**
 * Get RTL-aware flex direction
 * @param locale - Current locale ('ar' | 'en')
 * @returns 'flex-row-reverse' for RTL, 'flex-row' for LTR
 */
export function getFlexDirection(locale: string): string {
  return locale === 'ar' ? 'flex-row-reverse' : 'flex-row';
}

/**
 * Get RTL-aware border radius classes
 * @param locale - Current locale ('ar' | 'en')
 * @param left - Left border radius class (e.g., 'rounded-l-md')
 * @param right - Right border radius class (e.g., 'rounded-r-md')
 * @returns Appropriate border radius class based on locale
 */
export function getBorderRadiusClass(locale: string, left: string, right: string): string {
  return locale === 'ar' ? right : left;
}

/**
 * Combine multiple RTL-aware classes
 * @param locale - Current locale ('ar' | 'en')
 * @param classes - Object with left and right class pairs
 * @returns Combined class string
 */
export function getRTLClasses(locale: string, classes: Record<string, { left: string; right: string }>): string {
  return Object.values(classes)
    .map(({ left, right }) => locale === 'ar' ? right : left)
    .join(' ');
}

/**
 * Get direction attribute
 * @param locale - Current locale ('ar' | 'en')
 * @returns 'rtl' or 'ltr'
 */
export function getDirection(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Check if locale is RTL
 * @param locale - Current locale ('ar' | 'en')
 * @returns true if RTL, false otherwise
 */
export function isRTL(locale: string): boolean {
  return locale === 'ar';
}

