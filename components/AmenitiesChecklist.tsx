'use client';

import { useState } from 'react';

const STANDARD_AMENITIES = [
  'High-speed internet',
  'Kitchen/break room',
  'Meeting rooms',
  'Printer/office equipment',
  'Reception area',
  'Natural light/windows',
  'Parking',
  '24/7 access',
];

interface AmenitiesChecklistProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
}

export default function AmenitiesChecklist({ selected, onChange }: AmenitiesChecklistProps) {
  const [customAmenity, setCustomAmenity] = useState('');
  
  const toggleAmenity = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter(a => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };
  
  const addCustomAmenity = () => {
    if (customAmenity.trim() && !selected.includes(customAmenity.trim())) {
      onChange([...selected, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold mb-3">Select Amenities</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {STANDARD_AMENITIES.map(amenity => (
          <label
            key={amenity}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            <input
              type="checkbox"
              checked={selected.includes(amenity)}
              onChange={() => toggleAmenity(amenity)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm">{amenity}</span>
          </label>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={customAmenity}
          onChange={(e) => setCustomAmenity(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomAmenity()}
          placeholder="Add custom amenity..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addCustomAmenity}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

