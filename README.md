# Office Space Listing Assistant

## Sample Output

Here's what a completed listing looks like:

```
Private FiDi Office with River Views
3,000 sq ft • 10-12 desks • $9,000/mo

Located in Financial District with stunning floor-to-ceiling 
Hudson River views. Includes 3 private offices, open workspace, 
and fully equipped meeting rooms. Perfect for growing teams 
looking for an inspiring workspace.

✓ High-speed internet
✓ Kitchen & break room
✓ Meeting rooms
✓ Natural light
✓ Office equipment

Available immediately
Month-to-month terms
No restrictions
```

### Conversation Example

```
Bot: Hey! Let's get your space listed. Where's your office located?
User: NYC
Bot: Nice! Which neighborhood in NYC?
User: Financial District
Bot: Got it - Financial District. How much space are you looking to sublet?
User: around 3000 sqft
Bot: Perfect! 3,000 sq ft. Is this the entire floor, or part of a larger office?
User: Partial floor
Bot: Got it - Partial floor. How many desks can this space accommodate?
User: 10-12 desks
Bot: Perfect! 10-12 desks. Moving on to configuration...
...
```

---

## About the Project

A conversational AI assistant that helps office space hosts create professional listings in **5 minutes** through a natural chat interface. Instead of filling out long forms, users simply chat with an AI assistant that guides them through the process conversationally.

### Key Features

- **AI-Powered Conversations**: Uses Groq AI (Llama 3.1) to generate natural, contextual responses
- **Multi-Phase Flow**: Guides users through 5 phases:
  1. Space Basics (location, size, type, capacity)
  2. Configuration & Amenities (layout, amenities, standout features)
  3. Terms & Availability (move-in date, lease terms, restrictions)
  4. Pricing Intelligence (suggested pricing with comparables)
  5. Listing Preview & Generation
- **Smart Pricing**: Location-based pricing tiers with amenity adjustments and comparable listings
- **Session Persistence**: Conversations are saved and can be resumed after page refresh
- **Modern UI**: Clean, responsive chat interface with typing indicators and smooth animations

### Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern styling
- **Groq AI** - Fast LLM inference with Llama 3.1
- **LocalStorage** - Session persistence

---

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Groq API key ([Get one here](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onboarding-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Then add your Groq API key:
   ```env
   GROQ_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

### Project Structure

```
├── app/
│   ├── api/
│   │   ├── groq/route.ts      # Groq AI API endpoint
│   │   └── listings/route.ts  # Listings API endpoint
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main chat interface
│   └── globals.css            # Global styles
├── components/
│   ├── ChatMessage.tsx        # Message bubble component
│   ├── ChatInput.tsx          # Input field component
│   ├── TypingIndicator.tsx    # Loading indicator
│   ├── AmenitiesChecklist.tsx # Amenities selector
│   ├── PricingPreview.tsx     # Pricing comparison UI
│   └── ListingPreview.tsx     # Final listing display
├── lib/
│   ├── conversationEngine.ts # Core conversation logic with AI
│   ├── pricing.ts            # Pricing calculations
│   ├── listingGenerator.ts   # Listing content generation
│   └── sessionStorage.ts     # Session persistence
└── types/
    └── index.ts              # TypeScript interfaces
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com | Yes |

---

## Usage

1. **Start a conversation** - The bot will greet you and ask about your space location
2. **Answer naturally** - Provide details as they're requested in a conversational way
3. **Select amenities** - Use the interactive checklist when prompted
4. **Review pricing** - See suggested rates and comparable listings
5. **Preview & save** - Review your formatted listing and save it

The whole process takes about 5-7 minutes and feels like chatting with a helpful assistant!

---

## License

MIT
