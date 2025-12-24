'use client';

import { Listing } from '@/types';
import { generateFormattedListing } from '@/lib/listingGenerator';
import { useState } from 'react';

interface ListingPreviewProps {
  listing: Listing;
  onEdit?: () => void;
  onSave?: () => void;
}

export default function ListingPreview({ listing, onEdit, onSave }: ListingPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  const formattedListing = generateFormattedListing(listing);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedListing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([formattedListing], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listing-${listing.listingId || 'preview'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">{listing.title}</h2>
        <div className="flex items-center space-x-4 text-gray-600 mb-4">
          <span>{listing.squareFeet.toLocaleString()} sq ft</span>
          <span>•</span>
          <span>{listing.deskCapacity} desk{listing.deskCapacity > 1 ? 's' : ''}</span>
          <span>•</span>
          <span className="font-semibold text-gray-900">${listing.monthlyRate.toLocaleString()}/mo</span>
        </div>
        
        <p className="text-gray-700 mb-4">{listing.description}</p>
        
        <div className="mb-4">
          {listing.amenities.map((amenity, idx) => (
            <div key={idx} className="flex items-center text-gray-700 mb-1">
              <span className="mr-2">✓</span>
              <span>{amenity}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="text-sm text-gray-600">
            <div>Available {listing.availableFrom}</div>
            <div>{listing.minimumTerm} terms</div>
            <div>{listing.restrictions || 'No restrictions'}</div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-6">
        <button
          onClick={handleCopy}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Listing'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Download
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Listing
          </button>
        )}
      </div>
    </div>
  );
}

