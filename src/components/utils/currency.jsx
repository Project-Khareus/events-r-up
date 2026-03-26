// Currency detection and formatting utility

const CURRENCY_MAP = {
  GH: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  US: { code: 'USD', symbol: '$', name: 'US Dollar' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound' },
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro' },
};

// Default to GHS (Ghanaian Cedi)
const DEFAULT_CURRENCY = { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' };

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