// Currency detection and formatting utility

export const CURRENCY_OPTIONS = [
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCY_OPTIONS.map(c => [c.code, c]));

// Default to GHS (Ghanaian Cedi)
const DEFAULT_CURRENCY = { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' };

/**
 * Get currency object by code. Falls back to GHS.
 */
export const getCurrencyByCode = (code) => {
  return CURRENCY_MAP[code] || DEFAULT_CURRENCY;
};

let cachedCurrency = null;

/**
 * Detect user's currency based on their location
 * Uses browser locale and timezone as fallback
 */
export const detectUserCurrency = async () => {
  // Always use GHS for this platform
  if (!cachedCurrency) {
    cachedCurrency = { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' };
  }
  return cachedCurrency;
};

/**
 * Format price with the appropriate currency symbol
 * @param {number} price - The price in USD
 * @param {object} currency - Currency object from detectUserCurrency
 */
export const formatPrice = (price, currency = DEFAULT_CURRENCY) => {
  if (!price && price !== 0) return null;
  
  const formattedNumber = price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return `${currency.symbol}${formattedNumber}`;
};

/**
 * Get currency info for display
 */
export const getCurrencyInfo = async () => {
  return await detectUserCurrency();
};