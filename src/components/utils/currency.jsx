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

// Default to USD
const DEFAULT_CURRENCY = { code: 'USD', symbol: '$', name: 'US Dollar' };

let cachedCurrency = null;

/**
 * Detect user's currency based on their location
 * Uses browser locale and timezone as fallback
 */
export const detectUserCurrency = async () => {
  if (cachedCurrency) {
    return cachedCurrency;
  }

  try {
    // Try to get country from browser locale
    const locale = navigator.language || navigator.userLanguage;
    const countryCode = locale.split('-')[1]?.toUpperCase();
    
    if (countryCode && CURRENCY_MAP[countryCode]) {
      cachedCurrency = CURRENCY_MAP[countryCode];
      return cachedCurrency;
    }

    // Fallback: Try to detect via timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      if (timezone.includes('Africa/Accra')) {
        cachedCurrency = CURRENCY_MAP.GH;
        return cachedCurrency;
      } else if (timezone.includes('Africa/Lagos')) {
        cachedCurrency = CURRENCY_MAP.NG;
        return cachedCurrency;
      } else if (timezone.includes('Africa/Nairobi')) {
        cachedCurrency = CURRENCY_MAP.KE;
        return cachedCurrency;
      } else if (timezone.includes('Africa/Johannesburg')) {
        cachedCurrency = CURRENCY_MAP.ZA;
        return cachedCurrency;
      }
    }

    // Default to USD
    cachedCurrency = DEFAULT_CURRENCY;
    return cachedCurrency;
  } catch (error) {
    console.error('Error detecting currency:', error);
    cachedCurrency = DEFAULT_CURRENCY;
    return cachedCurrency;
  }
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