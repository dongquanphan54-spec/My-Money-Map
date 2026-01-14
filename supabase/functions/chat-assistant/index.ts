import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const { message, context } = await req.json();
    const { portfolio, cashBalance, prices } = context || {};

    const systemInstruction = `
You are the intelligent financial assistant for "My-Money-Map", a crypto simulation app.

User's Live Data Context:
- Cash Balance: $${cashBalance?.toFixed(2) || "0.00"}
- Crypto Portfolio: ${JSON.stringify(portfolio)}
- Current Market Prices: ${JSON.stringify(prices)}

Your Role:
1. Answer questions about the user's specific balance and holdings using the data above.
2. Explain financial concepts simply and clearly.
3. Guide the user on how to use the app tools.

Style:
- Concise, friendly, and professional.
- If asked for total balance, sum cash + crypto value.
- Never give specific "buy/sell" financial advice, only analysis.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\nUser message: ${message}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data));

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No response from Gemini";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
