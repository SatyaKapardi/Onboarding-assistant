import { ComparableListing, Listing } from '@/types';

// Base pricing tiers by location
const PRICING_TIERS: Record<string, { min: number; max: number }> = {
  'nyc_fidi': { min: 2.80, max: 3.50 },
  'nyc_midtown': { min: 2.80, max: 3.50 },
  'nyc_other': { min: 2.20, max: 2.80 },
  'sf_soma': { min: 3.00, max: 3.80 },
  'sf_fidi': { min: 3.00, max: 3.80 },
  'sf_other': { min: 2.40, max: 3.00 },
  'la': { min: 2.00, max: 2.60 },
  'default': { min: 1.80, max: 2.40 },
};

export function getLocationTier(city: string, neighborhood: string): string {
  const cityLower = city.toLowerCase();
  const neighborhoodLower = neighborhood.toLowerCase();
  
  if (cityLower.includes('new york') || cityLower.includes('nyc')) {
    if (neighborhoodLower.includes('financial') || neighborhoodLower.includes('fidi')) {
      return 'nyc_fidi';
    }
    if (neighborhoodLower.includes('midtown')) {
      return 'nyc_midtown';
    }
    return 'nyc_other';
  }
  
  if (cityLower.includes('san francisco') || cityLower.includes('sf')) {
    if (neighborhoodLower.includes('soma') || neighborhoodLower.includes('financial')) {
      return 'sf_soma';
    }
    return 'sf_other';
  }
  
  if (cityLower.includes('los angeles') || cityLower.includes('la')) {
    return 'la';
  }
  
  return 'default';
}

export function calculateSuggestedPrice(listing: Partial<Listing>): {
  basePrice: number;
  suggestedRange: { min: number; max: number };
  pricePerSqft: number;
} {
  if (!listing.squareFeet || !listing.location || !listing.neighborhood) {
    return { basePrice: 0, suggestedRange: { min: 0, max: 0 }, pricePerSqft: 0 };
  }
  
  const tier = getLocationTier(listing.location, listing.neighborhood);
  const tierPricing = PRICING_TIERS[tier] || PRICING_TIERS.default;
  
  // Start with midpoint of tier
  let basePricePerSqft = (tierPricing.min + tierPricing.max) / 2;
  
  // Adjust for amenities (5+ amenities adds 10%)
  if (listing.amenities && listing.amenities.length >= 5) {
    basePricePerSqft *= 1.1;
  }
  
  // Adjust for standout features (adds 15%)
  const premiumFeatures = ['views', 'renovated', 'natural light', 'exposed brick', 'city views'];
  if (listing.standoutFeatures) {
    const hasPremium = premiumFeatures.some(feature => 
      listing.standoutFeatures!.toLowerCase().includes(feature)
    );
    if (hasPremium) {
      basePricePerSqft *= 1.15;
    }
  }
  
  const basePrice = basePricePerSqft * listing.squareFeet;
  const suggestedRange = {
    min: basePrice * 0.9,
    max: basePrice * 1.1,
  };
  
  return {
    basePrice,
    suggestedRange,
    pricePerSqft: basePricePerSqft,
  };
}

export const MOCK_COMPARABLES: ComparableListing[] = [
  {
    id: '1',
    location: 'New York',
    neighborhood: 'Financial District',
    squareFeet: 2500,
    monthlyRate: 7500,
    pricePerSqft: 3.00,
    amenities: ['High-speed internet', 'Kitchen', 'Meeting rooms', 'Natural light'],
    standoutFeatures: 'River views',
  },
  {
    id: '2',
    location: 'New York',
    neighborhood: 'Midtown',
    squareFeet: 4000,
    monthlyRate: 12000,
    pricePerSqft: 3.00,
    amenities: ['High-speed internet', 'Kitchen', 'Meeting rooms', 'Reception', 'Parking'],
    standoutFeatures: 'Recently renovated',
  },
  {
    id: '3',
    location: 'San Francisco',
    neighborhood: 'SOMA',
    squareFeet: 3000,
    monthlyRate: 10500,
    pricePerSqft: 3.50,
    amenities: ['High-speed internet', 'Kitchen', 'Meeting rooms', 'Natural light', '24/7 access'],
    standoutFeatures: 'Exposed brick',
  },
  {
    id: '4',
    location: 'Los Angeles',
    neighborhood: 'Downtown',
    squareFeet: 2000,
    monthlyRate: 5000,
    pricePerSqft: 2.50,
    amenities: ['High-speed internet', 'Kitchen', 'Meeting rooms'],
  },
];

export function getComparables(listing: Partial<Listing>): ComparableListing[] {
  if (!listing.location || !listing.squareFeet) {
    return MOCK_COMPARABLES.slice(0, 3);
  }
  
  // Filter by same city and similar size (±50%)
  const filtered = MOCK_COMPARABLES.filter(comp => {
    const sameCity = comp.location.toLowerCase().includes(listing.location!.toLowerCase()) ||
                     listing.location!.toLowerCase().includes(comp.location.toLowerCase());
    const similarSize = comp.squareFeet >= listing.squareFeet! * 0.5 &&
                       comp.squareFeet <= listing.squareFeet! * 1.5;
    return sameCity && similarSize;
  });
  
  // Return filtered or fallback to all
  return filtered.length >= 2 ? filtered.slice(0, 3) : MOCK_COMPARABLES.slice(0, 3);
}

