import { ConversationState, Listing } from '@/types';

const STORAGE_KEY_PREFIX = 'onboarding_assistant_';

export function saveSession(sessionId: string, state: ConversationState) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${sessionId}`,
      JSON.stringify({
        ...state,
        messages: state.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      })
    );
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

export function loadSession(sessionId: string): Partial<ConversationState> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      messages: parsed.messages?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })) || [],
    };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

export function saveListing(listing: Listing) {
  if (typeof window === 'undefined') return;
  
  try {
    const listings = getSavedListings();
    const existingIndex = listings.findIndex(l => l.sessionId === listing.sessionId);
    
    if (existingIndex >= 0) {
      listings[existingIndex] = listing;
    } else {
      listings.push(listing);
    }
    
    localStorage.setItem(`${STORAGE_KEY_PREFIX}listings`, JSON.stringify(listings));
  } catch (error) {
    console.error('Failed to save listing:', error);
  }
}

export function getSavedListings(): Listing[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}listings`);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((listing: any) => ({
      ...listing,
      createdAt: new Date(listing.createdAt),
      conversationHistory: listing.conversationHistory?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })) || [],
    }));
  } catch (error) {
    console.error('Failed to load listings:', error);
    return [];
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

