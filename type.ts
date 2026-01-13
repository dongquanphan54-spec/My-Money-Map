export interface PortfolioItem {
  id: string;
  symbol: string;
  amount: number;
  name: string;
}

export interface CryptoPrices {
  [key: string]: {
    usd: number;
  };
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT';
  assetId: string;
  amount: number;
  currency: 'USD';
  date: string;
  status: string;
}

export interface AiSuggestionRequest {
  portfolio: any[];
  totalValue: number;
}