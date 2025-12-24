import { NextRequest, NextResponse } from 'next/server';
import { Listing } from '@/types';

// In a real app, this would connect to a database
// For now, we'll use in-memory storage (or localStorage on client side)
const listings: Listing[] = [];

export async function POST(request: NextRequest) {
  try {
    const listing: Listing = await request.json();
    
    // Validate required fields
    if (!listing.location || !listing.squareFeet || !listing.monthlyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate listing ID if not provided
    if (!listing.listingId) {
      listing.listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add to storage (in production, save to database)
    listings.push(listing);
    
    return NextResponse.json({
      success: true,
      listingId: listing.listingId,
      url: `/listing/${listing.listingId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save listing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('id');
  
  if (listingId) {
    const listing = listings.find(l => l.listingId === listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(listing);
  }
  
  return NextResponse.json(listings);
}

