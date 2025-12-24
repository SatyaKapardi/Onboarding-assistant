import { ConversationPhase, ConversationState, Message, Listing } from '@/types';
import { calculateSuggestedPrice, getComparables } from './pricing';
import { generateListingTitle, generateListingDescription } from './listingGenerator';

// Import calculateSuggestedPrice for phase transitions

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

export class ConversationEngine {
  private state: ConversationState;
  
  constructor(sessionId: string, existingState?: Partial<ConversationState>) {
    this.state = {
      phase: existingState?.phase || 'greeting',
      listing: existingState?.listing || {},
      messages: existingState?.messages || [],
      sessionId,
      isTyping: false,
    };
  }
  
  getState(): ConversationState {
    return { ...this.state };
  }
  
  private addMessage(role: 'user' | 'assistant', content: string) {
    this.state.messages.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    });
  }
  
  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  
  private extractCity(text: string): string | null {
    // Simple extraction - in production, use NLP or geocoding API
    const cities = ['new york', 'nyc', 'san francisco', 'sf', 'los angeles', 'la', 'chicago', 'boston', 'seattle'];
    const textLower = text.toLowerCase();
    for (const city of cities) {
      if (textLower.includes(city)) {
        return city;
      }
    }
    return null;
  }
  
  async processUserMessage(userMessage: string, useAI: boolean = true): Promise<string[]> {
    this.addMessage('user', userMessage);
    
    // Extract structured data first (always do this)
    this.extractDataFromMessage(userMessage);
    
    // Generate AI response if enabled
    if (useAI) {
      try {
        const aiResponse = await this.generateAIResponse(userMessage);
        if (aiResponse) {
          this.addMessage('assistant', aiResponse);
          return [aiResponse];
        }
      } catch (error) {
        console.error('AI generation failed, falling back to rule-based:', error);
      }
    }
    
    // Fallback to rule-based responses
    const responses: string[] = [];
    
    switch (this.state.phase) {
      case 'greeting':
        return this.handleGreeting();
      
      case 'phase1_basics':
        return this.handlePhase1(userMessage);
      
      case 'phase2_config':
        return this.handlePhase2(userMessage);
      
      case 'phase3_terms':
        return this.handlePhase3(userMessage);
      
      case 'phase4_pricing':
        return this.handlePhase4(userMessage);
      
      case 'phase5_preview':
        return this.handlePhase5(userMessage);
      
      default:
        return ['Thanks! Your listing is complete.'];
    }
  }
  
  private async generateAIResponse(userMessage: string): Promise<string | null> {
    try {
      // Check if we need to transition phases based on extracted data
      this.checkPhaseTransitions();
      
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          context: {
            phase: this.state.phase,
            listing: this.state.listing,
            conversationHistory: this.state.messages.slice(-8).map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      return data.response || null;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      return null;
    }
  }
  
  private checkPhaseTransitions() {
    const listing = this.state.listing;
    
    // Phase 1 -> Phase 2: All basics collected
    if (this.state.phase === 'phase1_basics' && 
        listing.location && 
        listing.neighborhood && 
        listing.squareFeet && 
        listing.spaceType && 
        listing.deskCapacity) {
      this.state.phase = 'phase2_config';
    }
    
    // Phase 2 -> Phase 3: Layout and amenities collected
    if (this.state.phase === 'phase2_config' && 
        listing.privateOffices !== undefined && 
        listing.conferenceRooms !== undefined && 
        listing.amenities && 
        listing.amenities.length > 0 && 
        listing.standoutFeatures) {
      this.state.phase = 'phase3_terms';
    }
    
    // Phase 3 -> Phase 4: Terms collected
    if (this.state.phase === 'phase3_terms' && 
        listing.availableFrom && 
        listing.minimumTerm && 
        listing.restrictions !== undefined) {
      this.state.phase = 'phase4_pricing';
      // Generate pricing suggestions
      const pricing = calculateSuggestedPrice(listing);
      listing.suggestedPriceRange = pricing.suggestedRange;
      listing.pricePerSqft = pricing.pricePerSqft;
    }
    
    // Phase 4 -> Phase 5: Price set
    if (this.state.phase === 'phase4_pricing' && listing.monthlyRate) {
      this.state.phase = 'phase5_preview';
      this.generateFinalListing();
    }
  }
  
  private extractDataFromMessage(message: string) {
    const listing = this.state.listing;
    const messageLower = message.toLowerCase();
    
    // Extract location
    if (!listing.location && this.state.phase === 'phase1_basics') {
      const city = this.extractCity(message);
      if (city) {
        listing.location = city;
      } else if (message.length > 2 && !message.match(/^\d+$/)) {
        listing.location = message;
      }
    }
    
    // Extract neighborhood
    if (!listing.neighborhood && listing.location && this.state.phase === 'phase1_basics') {
      if (message.length > 2 && !message.match(/^\d+$/)) {
        listing.neighborhood = message;
      }
    }
    
    // Extract square footage
    if (!listing.squareFeet) {
      const sqft = this.extractNumber(message);
      if (sqft && sqft > 100) { // Reasonable minimum
        listing.squareFeet = sqft;
      }
    }
    
    // Extract desk capacity
    if (!listing.deskCapacity) {
      const desks = this.extractNumber(message);
      if (desks && desks > 0 && desks < 1000) { // Reasonable range
        listing.deskCapacity = desks;
      }
    }
    
    // Extract space type
    if (!listing.spaceType && this.state.phase === 'phase2_config') {
      if (messageLower.includes('entire') || messageLower.includes('whole') || messageLower.includes('full')) {
        listing.spaceType = 'Entire floor';
      } else if (messageLower.includes('partial') || messageLower.includes('part')) {
        listing.spaceType = 'Partial floor';
      } else if (messageLower.includes('private') || messageLower.includes('office')) {
        listing.spaceType = 'Private offices';
      }
    }
    
    // Extract private offices
    if (listing.privateOffices === undefined && this.state.phase === 'phase2_config') {
      const offices = this.extractNumber(message);
      if (offices !== null && offices >= 0 && offices < 100) {
        listing.privateOffices = offices;
      }
    }
    
    // Extract conference rooms
    if (listing.conferenceRooms === undefined && this.state.phase === 'phase2_config') {
      const rooms = this.extractNumber(message);
      if (rooms !== null && rooms >= 0 && rooms < 50) {
        listing.conferenceRooms = rooms;
      }
    }
    
    // Extract amenities from text
    if (this.state.phase === 'phase2_config') {
      const amenityKeywords: Record<string, string> = {
        'internet': 'High-speed internet',
        'wifi': 'High-speed internet',
        'kitchen': 'Kitchen/break room',
        'break room': 'Kitchen/break room',
        'meeting room': 'Meeting rooms',
        'conference': 'Meeting rooms',
        'printer': 'Printer/office equipment',
        'equipment': 'Printer/office equipment',
        'reception': 'Reception area',
        'natural light': 'Natural light/windows',
        'windows': 'Natural light/windows',
        'parking': 'Parking',
        '24/7': '24/7 access',
        '24 hour': '24/7 access',
      };
      
      const extractedAmenities: string[] = listing.amenities || [];
      for (const [keyword, amenity] of Object.entries(amenityKeywords)) {
        if (messageLower.includes(keyword) && !extractedAmenities.includes(amenity)) {
          extractedAmenities.push(amenity);
        }
      }
      if (extractedAmenities.length > 0) {
        listing.amenities = extractedAmenities;
      }
    }
    
    // Extract standout features
    if (!listing.standoutFeatures && this.state.phase === 'phase2_config') {
      const featureKeywords = ['exposed brick', 'city views', 'renovated', 'river views', 'views', 'brick'];
      const hasFeature = featureKeywords.some(keyword => messageLower.includes(keyword));
      if (hasFeature && message.length > 5) {
        listing.standoutFeatures = message;
      }
    }
    
    // Extract availability
    if (!listing.availableFrom && this.state.phase === 'phase3_terms') {
      listing.availableFrom = message;
    }
    
    // Extract minimum term
    if (!listing.minimumTerm && listing.availableFrom && this.state.phase === 'phase3_terms') {
      listing.minimumTerm = message;
    }
    
    // Extract restrictions
    if (listing.restrictions === undefined && listing.minimumTerm && this.state.phase === 'phase3_terms') {
      if (!messageLower.includes('none') && !messageLower.includes('no restriction')) {
        listing.restrictions = message;
      }
    }
    
    // Extract price
    if (!listing.monthlyRate && this.state.phase === 'phase4_pricing') {
      const priceMatch = message.match(/\$?([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (price > 0) {
          listing.monthlyRate = price;
          if (listing.squareFeet) {
            listing.pricePerSqft = price / listing.squareFeet;
          }
        }
      }
    }
  }
  
  private handleGreeting(): string[] {
    this.state.phase = 'phase1_basics';
    return [
      "Hey! Let's get your space listed. Where's your office located?",
    ];
  }
  
  private handlePhase1(message: string): string[] {
    const responses: string[] = [];
    const listing = this.state.listing;
    
    // Extract location
    if (!listing.location) {
      const city = this.extractCity(message);
      if (city) {
        listing.location = city;
        responses.push(`Nice! Which neighborhood in ${city === 'nyc' ? 'NYC' : city}?`);
        return responses;
      } else {
        // Accept any location
        listing.location = message;
        responses.push(`Got it - ${message}. Which neighborhood?`);
        return responses;
      }
    }
    
    // Extract neighborhood
    if (!listing.neighborhood && listing.location) {
      listing.neighborhood = message;
      responses.push(`Perfect! How much space are you looking to sublet?`);
      return responses;
    }
    
    // Extract square footage
    if (!listing.squareFeet) {
      const sqft = this.extractNumber(message);
      if (sqft) {
        listing.squareFeet = sqft;
        responses.push(`Great! ${sqft.toLocaleString()} sq ft. Is this the entire floor, or part of a larger office?`);
        return responses;
      } else {
        responses.push("Could you tell me the square footage? (e.g., 3000 sqft)");
        return responses;
      }
    }
    
    // Extract space type
    if (!listing.spaceType) {
      const messageLower = message.toLowerCase();
      if (messageLower.includes('entire') || messageLower.includes('whole') || messageLower.includes('full')) {
        listing.spaceType = 'Entire floor';
      } else if (messageLower.includes('partial') || messageLower.includes('part')) {
        listing.spaceType = 'Partial floor';
      } else if (messageLower.includes('private') || messageLower.includes('office')) {
        listing.spaceType = 'Private offices';
      } else {
        listing.spaceType = message;
      }
      responses.push(`Got it - ${listing.spaceType}. How many desks can this space accommodate?`);
      return responses;
    }
    
    // Extract desk capacity
    if (!listing.deskCapacity) {
      const desks = this.extractNumber(message);
      if (desks) {
        listing.deskCapacity = desks;
        responses.push(`Perfect! ${desks} desks. Moving on to configuration...`);
        this.state.phase = 'phase2_config';
        responses.push(this.getPhase2Question());
        return responses;
      } else {
        responses.push("How many desks can fit in the space? (e.g., 10 desks)");
        return responses;
      }
    }
    
    return responses;
  }
  
  private getPhase2Question(): string {
    return "Let's talk about the layout. How many private offices does the space have? (or type 'skip' if none)";
  }
  
  private handlePhase2(message: string): string[] {
    const responses: string[] = [];
    const listing = this.state.listing;
    const messageLower = message.toLowerCase();
    
    // Handle skip
    if (messageLower.includes('skip') || messageLower.includes('none') || messageLower.includes('n/a')) {
      if (!listing.privateOffices) {
        listing.privateOffices = 0;
        responses.push("No problem. How many conference or meeting rooms?");
        return responses;
      }
    }
    
    // Extract private offices
    if (listing.privateOffices === undefined) {
      const offices = this.extractNumber(message);
      if (offices !== null) {
        listing.privateOffices = offices;
        responses.push(`Great! ${offices} private office${offices > 1 ? 's' : ''}. How many conference or meeting rooms?`);
        return responses;
      } else {
        responses.push("Could you give me a number? (e.g., 3 offices, or type 'skip')");
        return responses;
      }
    }
    
    // Extract conference rooms
    if (listing.conferenceRooms === undefined) {
      const rooms = this.extractNumber(message);
      if (rooms !== null) {
        listing.conferenceRooms = rooms;
      } else if (messageLower.includes('skip') || messageLower.includes('none')) {
        listing.conferenceRooms = 0;
      } else {
        responses.push("How many meeting rooms? (or type 'skip')");
        return responses;
      }
    }
    
    // Move to amenities if not already there
    if (!listing.amenities || listing.amenities.length === 0) {
      // Try to extract amenities from message
      const amenityKeywords: Record<string, string> = {
        'internet': 'High-speed internet',
        'wifi': 'High-speed internet',
        'kitchen': 'Kitchen/break room',
        'break room': 'Kitchen/break room',
        'meeting room': 'Meeting rooms',
        'conference': 'Meeting rooms',
        'printer': 'Printer/office equipment',
        'equipment': 'Printer/office equipment',
        'reception': 'Reception area',
        'natural light': 'Natural light/windows',
        'windows': 'Natural light/windows',
        'parking': 'Parking',
        '24/7': '24/7 access',
        '24 hour': '24/7 access',
      };
      
      const extractedAmenities: string[] = [];
      const messageLower = message.toLowerCase();
      
      for (const [keyword, amenity] of Object.entries(amenityKeywords)) {
        if (messageLower.includes(keyword) && !extractedAmenities.includes(amenity)) {
          extractedAmenities.push(amenity);
        }
      }
      
      if (extractedAmenities.length > 0) {
        listing.amenities = extractedAmenities;
        responses.push(`Got it! I've noted: ${extractedAmenities.join(', ')}`);
        responses.push("Any other amenities? (You can also use the checklist below)");
        return responses;
      }
      
      responses.push("Now let's check off amenities. Which of these does your space have?");
      responses.push("(You can select multiple: High-speed internet, Kitchen/break room, Meeting rooms, Printer/office equipment, Reception area, Natural light/windows, Parking, 24/7 access)");
      responses.push("Or type them separated by commas.");
      return responses;
    }
    
    // If we have amenities, check if we need standout features
    if (!listing.standoutFeatures) {
      // Check if user provided standout features in this message
      const featureKeywords = ['exposed brick', 'city views', 'renovated', 'river views', 'views', 'brick', 'natural light'];
      const messageLower = message.toLowerCase();
      const hasFeature = featureKeywords.some(keyword => messageLower.includes(keyword));
      
      if (hasFeature || message.length > 10) {
        // User likely provided standout features
        listing.standoutFeatures = message;
        // Move to phase 3
        this.state.phase = 'phase3_terms';
        responses.push(`Perfect! "${message}" sounds great.`);
        responses.push("Now let's talk about availability and terms.");
        responses.push("When is the space available? (e.g., 'immediate', 'January 1st', 'next month')");
        return responses;
      }
      
      responses.push("Any standout features? (e.g., exposed brick, city views, recently renovated, river views)");
      return responses;
    }
    
    // Move to phase 3
    this.state.phase = 'phase3_terms';
    responses.push("Great! Now let's talk about availability and terms.");
    responses.push("When is the space available? (e.g., 'immediate', 'January 1st', 'next month')");
    return responses;
  }
  
  private handlePhase3(message: string): string[] {
    const responses: string[] = [];
    const listing = this.state.listing;
    
    // Extract availability
    if (!listing.availableFrom) {
      listing.availableFrom = message;
      responses.push(`Got it - available ${message}. What's the minimum lease term? (e.g., month-to-month, 3 months, 6 months, 12 months)`);
      return responses;
    }
    
    // Extract minimum term
    if (!listing.minimumTerm) {
      listing.minimumTerm = message;
      responses.push("Any restrictions? (e.g., industry types, noise levels, after-hours access) Or type 'none' if no restrictions.");
      return responses;
    }
    
    // Extract restrictions
    if (listing.restrictions === undefined) {
      if (message.toLowerCase().includes('none') || message.toLowerCase().includes('no restriction')) {
        listing.restrictions = undefined;
      } else {
        listing.restrictions = message;
      }
      
      // Move to pricing phase
      this.state.phase = 'phase4_pricing';
      const pricing = calculateSuggestedPrice(listing);
      const comparables = getComparables(listing);
      
      responses.push("Perfect! Let's talk pricing.");
      responses.push(`Based on your location and amenities, I suggest a price range of $${Math.round(pricing.suggestedRange.min).toLocaleString()}-$${Math.round(pricing.suggestedRange.max).toLocaleString()}/month ($${pricing.pricePerSqft.toFixed(2)}/sqft).`);
      responses.push(`Here are some comparable listings in your area:`);
      
      comparables.forEach(comp => {
        responses.push(`• ${comp.neighborhood}: ${comp.squareFeet.toLocaleString()} sqft @ $${comp.monthlyRate.toLocaleString()}/mo ($${comp.pricePerSqft.toFixed(2)}/sqft)`);
      });
      
      responses.push(`What monthly rate would you like to set?`);
      return responses;
    }
    
    return responses;
  }
  
  private handlePhase4(message: string): string[] {
    const responses: string[] = [];
    const listing = this.state.listing;
    
    // Extract price
    const priceMatch = message.match(/\$?([\d,]+)/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      listing.monthlyRate = price;
      
      if (listing.squareFeet) {
        listing.pricePerSqft = price / listing.squareFeet;
        
        // Validate pricing
        const pricing = calculateSuggestedPrice(listing);
        if (price > pricing.suggestedRange.max * 1.2) {
          responses.push(`That's $${listing.pricePerSqft.toFixed(2)}/sqft which is above market. Are you sure?`);
          return responses;
        }
      }
      
      // Generate final listing
      this.state.phase = 'phase5_preview';
      this.generateFinalListing();
      
      responses.push("Perfect! Here's your listing preview:");
      return responses;
    } else {
      responses.push("Could you provide the monthly rate as a number? (e.g., 9000 or $9,000)");
      return responses;
    }
  }
  
  private handlePhase5(message: string): string[] {
    const responses: string[] = [];
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('edit') || messageLower.includes('change') || messageLower.includes('back')) {
      responses.push("Which section would you like to edit? (basics, amenities, terms, pricing)");
      return responses;
    }
    
    if (messageLower.includes('save') || messageLower.includes('done') || messageLower.includes('yes')) {
      this.state.phase = 'complete';
      responses.push("Great! Your listing has been saved. You'll receive a shareable URL shortly.");
      return responses;
    }
    
    return responses;
  }
  
  private generateFinalListing() {
    const listing = this.state.listing;
    
    // Generate title and description
    listing.title = generateListingTitle(listing);
    listing.description = generateListingDescription(listing);
    
    // Calculate pricing if not set
    if (!listing.monthlyRate && listing.squareFeet) {
      const pricing = calculateSuggestedPrice(listing);
      listing.monthlyRate = Math.round(pricing.basePrice);
      listing.pricePerSqft = pricing.pricePerSqft;
      listing.suggestedPriceRange = pricing.suggestedRange;
    }
    
    // Set defaults
    if (!listing.amenities) {
      listing.amenities = [];
    }
    if (!listing.availableFrom) {
      listing.availableFrom = 'immediate';
    }
    if (!listing.minimumTerm) {
      listing.minimumTerm = 'month-to-month';
    }
  }
  
  setAmenities(amenities: string[]) {
    this.state.listing.amenities = amenities;
  }
  
  setStandoutFeatures(features: string) {
    this.state.listing.standoutFeatures = features;
  }
  
  getListing(): Partial<Listing> {
    return { ...this.state.listing };
  }
  
  getFullListing(): Listing | null {
    if (this.state.phase !== 'phase5_preview' && this.state.phase !== 'complete') {
      return null;
    }
    
    const listing = this.state.listing;
    if (!listing.location || !listing.squareFeet || !listing.monthlyRate) {
      return null;
    }
    
    return {
      location: listing.location || '',
      neighborhood: listing.neighborhood || '',
      squareFeet: listing.squareFeet || 0,
      spaceType: listing.spaceType || '',
      deskCapacity: listing.deskCapacity || 0,
      privateOffices: listing.privateOffices,
      conferenceRooms: listing.conferenceRooms,
      amenities: listing.amenities || [],
      standoutFeatures: listing.standoutFeatures,
      availableFrom: listing.availableFrom || 'immediate',
      minimumTerm: listing.minimumTerm || 'month-to-month',
      restrictions: listing.restrictions,
      monthlyRate: listing.monthlyRate || 0,
      pricePerSqft: listing.pricePerSqft || 0,
      suggestedPriceRange: listing.suggestedPriceRange,
      title: listing.title || '',
      description: listing.description || '',
      conversationHistory: this.state.messages,
      createdAt: new Date(),
      sessionId: this.state.sessionId,
    };
  }
}

