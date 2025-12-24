import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userMessage, context } = await request.json();
    
    const systemPrompt = `You are a friendly, helpful assistant helping office space hosts create listings. 
You're conducting a conversational interview to gather information about their space.

Current phase: ${context.phase}
Information collected so far:
${JSON.stringify(context.listing, null, 2)}

Guidelines:
- Be friendly, conversational, and encouraging
- Ask ONE question at a time
- Acknowledge what the user said before asking the next question
- Extract structured information from their responses
- If they provide multiple details, acknowledge each one
- Keep responses concise (1-2 sentences max)
- Use natural language, not robotic
- Don't repeat information you already have

Phase-specific instructions:
- Phase 1 (basics): Get location, neighborhood, square footage, space type, desk capacity. If you have location but not neighborhood, ask for neighborhood. If you have both, ask for square footage, etc.
- Phase 2 (config): Get layout details (offices, meeting rooms), amenities, standout features. If they mention amenities in text, acknowledge them.
- Phase 3 (terms): Get availability date, minimum lease term, restrictions
- Phase 4 (pricing): Present pricing suggestions and comparables, then ask what rate they want
- Phase 5 (preview): Show the listing preview and ask if they want to save

Respond naturally as if you're having a friendly conversation. Keep it short and conversational.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...(context.conversationHistory || []).slice(-8).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.1-8b-instant', // Updated to currently available model
      temperature: 0.7,
      max_tokens: 250,
    });

    const response = completion.choices[0]?.message?.content || "I'm here to help you create your listing!";
    
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    );
  }
}

