import { Listing } from '@/types';

export function generateListingTitle(listing: Partial<Listing>): string {
  if (!listing.neighborhood || !listing.standoutFeatures) {
    return `${listing.spaceType || 'Office'} Space in ${listing.neighborhood || listing.location || 'Downtown'}`;
  }
  
  // Create title from standout feature + neighborhood
  const feature = listing.standoutFeatures.split(',')[0].trim();
  const neighborhood = listing.neighborhood;
  
  // Capitalize first letter
  const capitalizedFeature = feature.charAt(0).toUpperCase() + feature.slice(1);
  
  return `${capitalizedFeature} ${neighborhood} Office`;
}

export function generateListingDescription(listing: Partial<Listing>): string {
  const parts: string[] = [];
  
  // Location
  if (listing.neighborhood && listing.location) {
    parts.push(`Located in ${listing.neighborhood}, ${listing.location}`);
  } else if (listing.location) {
    parts.push(`Located in ${listing.location}`);
  }
  
  // Standout features
  if (listing.standoutFeatures) {
    const features = listing.standoutFeatures.split(',').map(f => f.trim());
    if (features.length > 0) {
      parts.push(`with ${features[0]}`);
    }
  }
  
  // Configuration details
  const configParts: string[] = [];
  if (listing.privateOffices) {
    configParts.push(`${listing.privateOffices} private office${listing.privateOffices > 1 ? 's' : ''}`);
  }
  if (listing.conferenceRooms) {
    configParts.push(`${listing.conferenceRooms} meeting room${listing.conferenceRooms > 1 ? 's' : ''}`);
  }
  if (listing.deskCapacity) {
    configParts.push(`space for ${listing.deskCapacity} desk${listing.deskCapacity > 1 ? 's' : ''}`);
  }
  
  if (configParts.length > 0) {
    parts.push(`Includes ${configParts.join(', ')}`);
  }
  
  // Target audience
  if (listing.deskCapacity && listing.deskCapacity >= 10) {
    parts.push('Perfect for growing teams looking for an inspiring workspace');
  } else {
    parts.push('Perfect for small teams or startups');
  }
  
  return parts.join('. ') + '.';
}

export function generateFormattedListing(listing: Listing): string {
  const lines: string[] = [];
  
  // Title
  lines.push(listing.title);
  lines.push('');
  
  // Stats
  const stats = [
    `${listing.squareFeet.toLocaleString()} sq ft`,
    `${listing.deskCapacity} desk${listing.deskCapacity > 1 ? 's' : ''}`,
    `$${listing.monthlyRate.toLocaleString()}/mo`,
  ];
  lines.push(stats.join(' • '));
  lines.push('');
  
  // Description
  lines.push(listing.description);
  lines.push('');
  
  // Amenities
  listing.amenities.forEach(amenity => {
    lines.push(`✓ ${amenity}`);
  });
  
  if (listing.amenities.length > 0) {
    lines.push('');
  }
  
  // Terms
  lines.push(`Available ${listing.availableFrom}`);
  lines.push(`${listing.minimumTerm} terms`);
  if (listing.restrictions) {
    lines.push(listing.restrictions);
  } else {
    lines.push('No restrictions');
  }
  
  return lines.join('\n');
}

