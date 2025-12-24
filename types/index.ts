export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Listing {
  // Basic info
  location: string;
  neighborhood: string;
  squareFeet: number;
  spaceType: string;
  deskCapacity: number;
  
  // Configuration
  privateOffices?: number;
  conferenceRooms?: number;
  amenities: string[];
  standoutFeatures?: string;
  
  // Terms
  availableFrom: string;
  minimumTerm: string;
  restrictions?: string;
  
  // Pricing
  monthlyRate: number;
  pricePerSqft: number;
  suggestedPriceRange?: {
    min: number;
    max: number;
  };
  
  // Generated content
  title: string;
  description: string;
  
  // Metadata
  conversationHistory: Message[];
  createdAt: Date;
  sessionId: string;
  listingId?: string;
}

export type ConversationPhase = 
  | 'greeting'
  | 'phase1_basics'
  | 'phase2_config'
  | 'phase3_terms'
  | 'phase4_pricing'
  | 'phase5_preview'
  | 'complete';

export interface ConversationState {
  phase: ConversationPhase;
  listing: Partial<Listing>;
  messages: Message[];
  sessionId: string;
  isTyping: boolean;
}

export interface ComparableListing {
  id: string;
  location: string;
  neighborhood: string;
  squareFeet: number;
  monthlyRate: number;
  pricePerSqft: number;
  amenities: string[];
  standoutFeatures?: string;
}

