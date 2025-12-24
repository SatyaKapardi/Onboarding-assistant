'use client';

import { useState, useEffect, useRef } from 'react';
import { ConversationEngine } from '@/lib/conversationEngine';
import { ConversationPhase, Listing } from '@/types';
import { saveSession, loadSession, saveListing, generateSessionId } from '@/lib/sessionStorage';
import ChatMessage from '@/components/ChatMessage';
import TypingIndicator from '@/components/TypingIndicator';
import ChatInput from '@/components/ChatInput';
import AmenitiesChecklist from '@/components/AmenitiesChecklist';
import PricingPreview from '@/components/PricingPreview';
import ListingPreview from '@/components/ListingPreview';
import { calculateSuggestedPrice, getComparables } from '@/lib/pricing';

export default function Home() {
  const [engine, setEngine] = useState<ConversationEngine | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // Try to load existing session
    const saved = loadSession(newSessionId);
    const newEngine = new ConversationEngine(newSessionId, saved);
    
    // If no saved state, start greeting
    if (!saved || !saved.messages || saved.messages.length === 0) {
      // Start with greeting message
      const greetingMessage = "Hey! Let's get your space listed. Where's your office located?";
      newEngine.getState().messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date(),
      });
      newEngine.getState().phase = 'phase1_basics';
      const state = newEngine.getState();
      setEngine(newEngine);
      saveSession(newSessionId, state);
    } else {
      setEngine(newEngine);
    }
  }, []);
  
  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [engine?.getState().messages, isTyping]);
  
  const handleSendMessage = async (message: string) => {
    if (!engine) return;
    
    const state = engine.getState();
    const phase = state.phase;
    
    // Handle amenities phase - show checklist if user mentions amenities
    if (phase === 'phase2_config' && (message.toLowerCase().includes('amenit') || message.toLowerCase().includes('checklist'))) {
      setShowAmenities(true);
      return;
    }
    
    // Process message with AI
    setIsTyping(true);
    try {
      const responses = await engine.processUserMessage(message, true); // Use AI
      const newState = engine.getState();
      setEngine(engine);
      
      // Save session
      saveSession(sessionId, newState);
      
      // Check if we should show amenities checklist
      if (newState.phase === 'phase2_config') {
        const lastMessage = newState.messages[newState.messages.length - 1];
        if (lastMessage?.content.includes('amenities') || 
            lastMessage?.content.includes('check off') ||
            lastMessage?.content.includes('select multiple') ||
            lastMessage?.content.includes('checklist')) {
          setShowAmenities(true);
        }
      }
      
      // Hide amenities if we moved past phase 2
      if (newState.phase !== 'phase2_config') {
        setShowAmenities(false);
      }
      
      // Check if we should show pricing preview
      if (newState.phase === 'phase4_pricing') {
        setShowPricing(true);
      } else {
        setShowPricing(false);
      }
      
      // Check if we should generate final listing
      if (newState.phase === 'phase5_preview' && newState.listing.monthlyRate) {
        const fullListing = engine.getFullListing();
        if (fullListing) {
          // Listing is ready
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleAmenitiesChange = (amenities: string[]) => {
    if (!engine) return;
    
    engine.setAmenities(amenities);
    const state = engine.getState();
    setEngine(engine);
    saveSession(sessionId, state);
    
    // Auto-continue if we have amenities and no standout features yet
    if (amenities.length > 0 && !state.listing.standoutFeatures) {
      // Don't auto-send, let user continue naturally
    }
  };
  
  const handleStandoutFeatures = (features: string) => {
    if (!engine) return;
    
    engine.setStandoutFeatures(features);
    const state = engine.getState();
    setEngine(engine);
    saveSession(sessionId, state);
    
    // Continue to next phase
    handleSendMessage(features);
  };
  
  const handlePriceChange = (price: number) => {
    if (!engine) return;
    
    const state = engine.getState();
    state.listing.monthlyRate = price;
    state.listing.pricePerSqft = price / (state.listing.squareFeet || 1);
    setEngine(engine);
    saveSession(sessionId, state);
  };
  
  const handleSaveListing = () => {
    if (!engine) return;
    
    const listing = engine.getFullListing();
    if (listing) {
      listing.listingId = `listing_${Date.now()}`;
      saveListing(listing);
      
      // Update phase
      const state = engine.getState();
      state.phase = 'complete';
      setEngine(engine);
      saveSession(sessionId, state);
      
      alert(`Listing saved! Shareable URL: ${window.location.origin}/listing/${listing.listingId}`);
    }
  };
  
  if (!engine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  const state = engine.getState();
  const phase = state.phase;
  const listing = state.listing;
  const fullListing = engine.getFullListing();
  
  // Get phase number for progress indicator
  const phaseNumber = phase === 'greeting' ? 0 :
                      phase === 'phase1_basics' ? 1 :
                      phase === 'phase2_config' ? 2 :
                      phase === 'phase3_terms' ? 3 :
                      phase === 'phase4_pricing' ? 4 :
                      phase === 'phase5_preview' ? 5 : 6;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Office Space Listing Assistant</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create your listing in 5 minutes • Phase {phaseNumber}/5
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex max-w-4xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {isTyping && <TypingIndicator />}
            
            {/* Amenities Checklist */}
            {showAmenities && phase === 'phase2_config' && (
              <div className="mb-4">
                <AmenitiesChecklist
                  selected={listing.amenities || []}
                  onChange={handleAmenitiesChange}
                />
                {listing.amenities && listing.amenities.length > 0 && !listing.standoutFeatures && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Great! Now, any standout features?</p>
                    <input
                      type="text"
                      placeholder="e.g., exposed brick, city views, recently renovated"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleStandoutFeatures(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Press Enter to continue, or type in chat</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Pricing Preview */}
            {showPricing && phase === 'phase4_pricing' && listing.squareFeet && (
              <div className="mb-4">
                {(() => {
                  const pricing = calculateSuggestedPrice(listing);
                  const comparables = getComparables(listing);
                  return (
                    <PricingPreview
                      suggestedRange={pricing.suggestedRange}
                      pricePerSqft={pricing.pricePerSqft}
                      squareFeet={listing.squareFeet}
                      comparables={comparables}
                      currentPrice={listing.monthlyRate}
                      onPriceChange={handlePriceChange}
                    />
                  );
                })()}
              </div>
            )}
            
            {/* Listing Preview */}
            {fullListing && phase === 'phase5_preview' && (
              <div className="mb-4">
                <ListingPreview
                  listing={fullListing}
                  onSave={handleSaveListing}
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          {phase !== 'complete' && (
            <ChatInput
              onSend={handleSendMessage}
              disabled={isTyping}
              placeholder={
                phase === 'phase2_config' && showAmenities
                  ? 'Type standout features or click "done" to continue...'
                  : 'Type your message...'
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

