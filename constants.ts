export const SUPABASE_URL = "https://llkiuwhcqeooeewkmhyw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsa2l1d2hjcWVvb2Vld2ttaHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjY0NzUsImV4cCI6MjA4MTM0MjQ3NX0.giLbNpyRXJiCd4Q0TbHNrwQjjQXdA8_Va1mssZRVyRM";

export const EDGE_FUNCTION_URLS = {
  FETCH_PRICES: `${SUPABASE_URL}/functions/v1/fetch-crypto-prices`,
  GENERATE_SUGGESTION: `${SUPABASE_URL}/functions/v1/generate-suggestion`,
  CHAT_ASSISTANT: `${SUPABASE_URL}/functions/v1/chat-assistant`
};