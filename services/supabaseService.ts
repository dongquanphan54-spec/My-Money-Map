import { SUPABASE_ANON_KEY, EDGE_FUNCTION_URLS } from '../constants';
import { CryptoPrices, AiSuggestionRequest } from '../types';

// Mock data generator for fallback when API is unreachable
const getMockPrices = (): CryptoPrices => ({
  bitcoin: { usd: 64230.50 + (Math.random() * 500 - 250) },
  ethereum: { usd: 3450.20 + (Math.random() * 50 - 25) },
  solana: { usd: 148.10 + (Math.random() * 10 - 5) },
});

const MOCK_SUGGESTIONS = [
  "Analysis (Offline Mode): Your portfolio shows a strong allocation in growth assets. Given current market volatility, consider dollar-cost averaging into Bitcoin to stabilize your long-term hold.",
  "Analysis (Offline Mode): Great entry points detected for Ethereum. Your current holdings are well-balanced, but increasing ETH allocation could capture upcoming upgrade value.",
  "Analysis (Offline Mode): Caution is advised. The market is showing signs of overheating. Consider setting stop-loss orders on your Solana positions to protect gains."
];

const getMockSuggestion = () => MOCK_SUGGESTIONS[Math.floor(Math.random() * MOCK_SUGGESTIONS.length)];

/**
 * Calls the Supabase Edge Function to fetch crypto prices.
 */
export const fetchCryptoPrices = async (): Promise<CryptoPrices | null> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URLS.FETCH_PRICES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching prices: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("API call failed, switching to offline mock data for prices.", error);
    // Return mock data so the app remains functional
    return new Promise((resolve) => {
      setTimeout(() => resolve(getMockPrices()), 800); // Simulate network delay
    });
  }
};

/**
 * Calls the Supabase Edge Function to generate AI suggestions.
 */
export const generateAiSuggestion = async (data: AiSuggestionRequest): Promise<string> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URLS.GENERATE_SUGGESTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error generating suggestion: ${response.statusText}`);
    }

    const result = await response.json();
    return result.suggestion;
  } catch (error) {
    console.warn("API call failed, switching to offline mock data for suggestion.", error);
    // Return mock suggestion
    return new Promise((resolve) => {
      setTimeout(() => resolve(getMockSuggestion()), 1500); // Simulate AI processing delay
    });
  }
};

/**
 * Calls the Supabase Edge Function for the Chat Assistant.
 */
export const sendChatMessage = async (
  message: string, 
  context: { portfolio: any[], cashBalance: number, prices: CryptoPrices | null }
): Promise<string> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URLS.CHAT_ASSISTANT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      throw new Error(`Error chatting with assistant: ${response.statusText}`);
    }

    const result = await response.json();
    return result.reply;
  } catch (error) {
    console.warn("API call failed, returning offline chat response.", error);
    return "I'm currently offline and can't access the advanced AI features. Please check your internet connection or try again later.";
  }
};