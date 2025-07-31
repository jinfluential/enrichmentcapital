export interface OptionData {
  // Basic option info
  symbol: string;
  ticker: string;
  strike: number;
  expiration: string;
  optionType: 'call' | 'put';
  
  // Market data
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  
  // Underlying stock data
  stockPrice: number;
  
  // Black-Scholes inputs
  timeToExpiration: number; // in years
  riskFreeRate: number;
  impliedVolatility: number;
  
  // Calculated values
  theoreticalPrice: number;
  edge: number; // percentage edge
  
  // Greeks
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  
  // Additional metrics
  moneyness: number; // (strike - stock) / stock * 100
  bidAskSpread: number;
  bidAskSpreadPercent: number;
  
  // Strategy analysis
  strategyType: 'covered-call' | 'cash-secured-put';
  breakevenPrice: number;
  maxProfit: number;
  collateralRequired: number;
  annualizedReturn: number;
  assignmentProbability: number;
  
  // Black-Scholes intermediate values
  d1: number;
  d2: number;
  nd1: number;
  nd2: number;
  
  // Data quality indicators
  priceSource: 'last' | 'mid' | 'bid' | 'ask';
  dataAge: number; // minutes since last update
  hasLiquidityWarning: boolean;
  hasSpreadWarning: boolean;
  hasStaleDataWarning: boolean;
}

export interface SearchResults {
  opportunities: OptionData[];
  isLoading: boolean;
  currentSymbol: string;
  progress: number;
  error: string | null;
}

export interface SearchOptions {
  onProgress?: (current: number, total: number, symbol: string) => void;
  minEdge: number;
  minVolume: number;
  minPrice: number;
}

export interface BlackScholesInputs {
  S: number; // Current stock price
  K: number; // Strike price
  T: number; // Time to expiration (years)
  r: number; // Risk-free rate
  sigma: number; // Implied volatility
}

export interface GreeksData {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  options: RawOptionData[];
}

export interface RawOptionData {
  contractSymbol: string;
  strike: number;
  expiration: string;
  optionType: 'call' | 'put';
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
}
