'use client';

import { ComparableListing } from '@/types';
import { useState } from 'react';

interface PricingPreviewProps {
  suggestedRange: { min: number; max: number };
  pricePerSqft: number;
  squareFeet: number;
  comparables: ComparableListing[];
  currentPrice?: number;
  onPriceChange: (price: number) => void;
}

export default function PricingPreview({
  suggestedRange,
  pricePerSqft,
  squareFeet,
  comparables,
  currentPrice,
  onPriceChange,
}: PricingPreviewProps) {
  const [priceInput, setPriceInput] = useState(currentPrice?.toString() || Math.round(suggestedRange.min).toString());
  
  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const numValue = parseInt(value.replace(/,/g, ''), 10);
    if (!isNaN(numValue)) {
      onPriceChange(numValue);
    }
  };
  
  const maxPrice = Math.max(...comparables.map(c => c.monthlyRate), suggestedRange.max);
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Pricing Intelligence</h3>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Suggested range: ${Math.round(suggestedRange.min).toLocaleString()} - ${Math.round(suggestedRange.max).toLocaleString()}/month
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Based on ${pricePerSqft.toFixed(2)}/sqft for {squareFeet.toLocaleString()} sqft
        </p>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Monthly Rate:</label>
          <input
            type="text"
            value={priceInput}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="9000"
          />
          <span className="text-sm text-gray-600">
            (${((parseInt(priceInput.replace(/,/g, '')) || 0) / squareFeet).toFixed(2)}/sqft)
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Comparable Listings</h4>
        <div className="space-y-2">
          {comparables.map(comp => (
            <div key={comp.id} className="text-sm border-l-2 border-blue-500 pl-3">
              <div className="font-medium">{comp.neighborhood}</div>
              <div className="text-gray-600">
                {comp.squareFeet.toLocaleString()} sqft • ${comp.monthlyRate.toLocaleString()}/mo • ${comp.pricePerSqft.toFixed(2)}/sqft
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative h-8 bg-gray-200 rounded">
        <div
          className="absolute h-full bg-blue-500 rounded"
          style={{
            left: `${(suggestedRange.min / maxPrice) * 100}%`,
            width: `${((suggestedRange.max - suggestedRange.min) / maxPrice) * 100}%`,
          }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-red-500"
          style={{
            left: `${((parseInt(priceInput.replace(/,/g, '')) || 0) / maxPrice) * 100}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>${Math.round(suggestedRange.min).toLocaleString()}</span>
        <span>${Math.round(suggestedRange.max).toLocaleString()}</span>
      </div>
    </div>
  );
}

