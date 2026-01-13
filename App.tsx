import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserCircle, 
  Wallet, 
  TrendingUp, 
  Lightbulb, 
  DollarSign, 
  Activity,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  LogIn,
  MessageSquare,
  X,
  Send
} from 'lucide-react';
import { fetchCryptoPrices, generateAiSuggestion, sendChatMessage } from './services/supabaseService';
import { PortfolioItem, CryptoPrices, Transaction } from './types';

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { id: 'bitcoin', symbol: 'BTC', amount: 0.5, name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', amount: 2.0, name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', amount: 10.0, name: 'Solana' },
];

export default function App() {
  // Auth State
  const [user, setUser] = useState<{name: string, accountId: string} | null>(null);
  const [loginName, setLoginName] = useState("");

  // App State
  const [prices, setPrices] = useState<CryptoPrices | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [cashBalance, setCashBalance] = useState<number>(5000.00); // Simulated USD Wallet
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investAmount, setInvestAmount] = useState<string>("100");
  const [investAsset, setInvestAsset] = useState<string>("ethereum");
  const [transactionStatus, setTransactionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hello! I'm your AI financial assistant. Ask me about your balance, crypto concepts, or how to use the app." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadPrices = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const data = await fetchCryptoPrices();
      if (data) {
        setPrices(data);
      }
    } catch (error) {
      console.error("Failed to load prices", error);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const calculateTotalValue = () => {
    let cryptoValue = 0;
    if (prices) {
      cryptoValue = portfolio.reduce((acc, item) => {
        const price = prices[item.id]?.usd || 0;
        return acc + (price * item.amount);
      }, 0);
    }
    return cryptoValue + cashBalance;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) return;
    
    // Generate a mock Account ID based on name length or random
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountId = `FNT-${loginName.substring(0, 3).toUpperCase()}-${randomSuffix}`;
    
    setUser({
      name: loginName,
      accountId: accountId
    });
  };

  const handleTopUp = () => {
    const amount = 1000;
    setCashBalance(prev => prev + amount);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'DEPOSIT',
      assetId: 'USD',
      amount: amount,
      currency: 'USD',
      date: new Date().toISOString(),
      status: 'Completed'
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    setTransactionStatus({
      type: 'success',
      message: 'Successfully added $1,000.00 to your wallet.'
    });
  };

  const handleGenerateSuggestion = async () => {
    if (!prices) return;
    setLoadingSuggestion(true);
    try {
      const totalValue = calculateTotalValue();
      const portfolioData = portfolio.map(p => ({
        ...p,
        currentPrice: prices[p.id]?.usd,
        value: (prices[p.id]?.usd || 0) * p.amount
      }));
      
      const suggestionText = await generateAiSuggestion({
        portfolio: portfolioData,
        totalValue
      });
      setSuggestion(suggestionText);
    } catch (error) {
      console.error("Error generating suggestion", error);
      setSuggestion("Could not generate suggestion at this time.");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionStatus(null);
    
    const amount = parseFloat(investAmount);
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      setTransactionStatus({ type: 'error', message: "Please enter a valid amount." });
      return;
    }

    if (amount > cashBalance) {
      setTransactionStatus({ type: 'error', message: "Error: Insufficient funds in USD Wallet." });
      return;
    }

    if (!prices || !prices[investAsset]) {
      setTransactionStatus({ type: 'error', message: "Market data unavailable. Please try again." });
      return;
    }

    // Execute Transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'BUY',
      assetId: investAsset,
      amount: amount,
      currency: 'USD',
      date: new Date().toISOString(),
      status: 'Completed'
    };

    setTransactions(prev => [newTransaction, ...prev]);
    
    // Deduct Cash
    setCashBalance(prev => prev - amount);

    // Add Crypto
    const coinAmount = amount / prices[investAsset].usd;
    setPortfolio(prev => prev.map(item => {
      if (item.id === investAsset) {
        return { ...item, amount: item.amount + coinAmount };
      }
      return item;
    }));
    
    setTransactionStatus({ 
      type: 'success', 
      message: `Successfully invested $${amount.toFixed(2)} in ${investAsset.toUpperCase()}.` 
    });
    setInvestAmount(""); // Reset input
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      // Prepare context for the agent
      const context = {
        portfolio: portfolio.map(p => ({
          ...p,
          currentValue: prices ? (prices[p.id]?.usd || 0) * p.amount : 0
        })),
        cashBalance,
        prices
      };

      const reply = await sendChatMessage(userMsg, context);
      
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble connecting to the server." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            My-Money-Map
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your personal crypto portfolio simulator
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Enter your name to start
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g. Alex Miller"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Access Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  const totalValue = calculateTotalValue();

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">My-Money-Map</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.accountId}</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
              <UserCircle className="w-6 h-6" />
            </div>
            <button 
              onClick={() => setUser(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Logout"
            >
              <LogIn className="w-5 h-5 transform rotate-180" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Portfolio Overview */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-blue-600" />
              Portfolio Overview
            </h2>
            <button 
              onClick={loadPrices}
              disabled={loadingPrices}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title="Refresh Prices"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <p className="text-blue-100 text-sm mb-1">Total Net Worth</p>
            <div className="text-4xl font-bold">
              {loadingPrices ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Cash Wallet Card */}
            <div className="p-4 hover:bg-gray-50 transition-colors bg-green-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">USD Wallet</span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">CASH</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Available to Invest</span>
                <button 
                  onClick={handleTopUp}
                  className="flex items-center text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                  title="Add $1,000"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Top Up
                </button>
              </div>
            </div>

            {/* Crypto Assets */}
            {portfolio.map((item) => {
              const price = prices?.[item.id]?.usd;
              const value = price ? price * item.amount : 0;
              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">{item.name}</span>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.symbol}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {item.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{item.symbol}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {loadingPrices ? 'Updating...' : `≈ $${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI Suggestion */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              AI Investment Insight
            </h2>
          </div>
          
          {!suggestion ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Get personalized advice based on your current portfolio composition.</p>
              <button
                onClick={handleGenerateSuggestion}
                disabled={loadingSuggestion || !prices}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loadingSuggestion ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  <>
                    Generate AI Suggestion
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 relative">
               <h3 className="text-indigo-900 font-semibold mb-2">Gemini Analysis</h3>
               <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">{suggestion}</p>
               <button 
                onClick={() => setSuggestion(null)}
                className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 text-xs font-medium"
               >
                 Clear
               </button>
            </div>
          )}
        </section>

        {/* Investment & Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invest Form */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Quick Invest
            </h2>
            
            <form onSubmit={handleInvest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select 
                  value={investAsset}
                  onChange={(e) => setInvestAsset(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 border px-3"
                >
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="solana">Solana (SOL)</option>
                </select>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                  <span className="text-xs text-gray-500">Max: ${cashBalance.toFixed(2)}</span>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => {
                      setInvestAmount(e.target.value);
                      if(transactionStatus) setTransactionStatus(null);
                    }}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>

              {transactionStatus && (
                <div className={`rounded-md p-3 flex items-start ${
                  transactionStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {transactionStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium">{transactionStatus.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!prices}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Execute Order
              </button>
            </form>
          </section>

          {/* Transaction Log */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Recent Activity
            </h2>
            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                No recent transactions
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {tx.type === 'DEPOSIT' ? 'Deposit' : `${tx.type} ${tx.assetId.toUpperCase()}`}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleTimeString()}</span>
                    </div>
                    <div className={`text-sm font-bold ${tx.type === 'DEPOSIT' ? 'text-blue-600' : 'text-green-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* CHATBOT FLOATING UI */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 sm:w-96 mb-4 flex flex-col overflow-hidden animate-fade-in-up" style={{maxHeight: '500px', height: '60vh'}}>
            {/* Chat Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">Finance Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-blue-100 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your balance..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${
            isChatOpen ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}